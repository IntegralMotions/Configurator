import { decode, encode } from "@msgpack/msgpack"

export type Settings = {
  baudRate: number
  dataBits: 7 | 8
  stopBits: 1 | 2
  parity: "none" | "even" | "odd"
  bufferSize: number
  flowControl: "none" | "hardware"
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting"

type StartOptions = {
  onDisconnect?: () => void
  onReconnect?: () => void | Promise<void>
}

const defaultSettings: Settings = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  bufferSize: 65536,
  flowControl: "none",
}

const toHex = (bytes: Uint8Array): string =>
  [...bytes].map(b => b.toString(16).padStart(2, '0')).join(' ')

const SERIAL_STARTUP_DELAY_MS = 500

export const useUsb = () => {
  const isClient = typeof window !== "undefined"

  const settings = useState<Settings>("serial.settings", () => defaultSettings)
  const cobsEncoding = useCobsEncoding()

  const serialPort = ref<any | null>(null)
  let selectedPortInfo: { usbVendorId?: number, usbProductId?: number } | null = null
  const reader = ref<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const readableStream = ref<ReadableStreamDefaultController<Uint8Array> | null>(null)

  const reading = ref(false)
  const status = ref<ConnectionStatus>("disconnected")
  const connected = computed(() => status.value === "connected")
  let keepReconnecting = false
  let reconnecting = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let restartReceiver: (() => Promise<void>) | null = null
  let startOptions: StartOptions = {}

  const isSecure = computed(() => isClient && window.isSecureContext)
  const serialSupported = computed(() => isClient && "serial" in navigator)
  const isSupported = computed(() => serialSupported.value && isSecure.value)
  const hasDevice = computed<boolean>(() => serialPort.value !== null)

  const deviceName = computed(() => {
    if (!serialPort.value) return "No serial port"
    try {
      const info = serialPort.value?.getInfo?.()
      const vendor = info?.usbVendorId?.toString(16).padStart(4, "0")
      const product = info?.usbProductId?.toString(16).padStart(4, "0")
      if (vendor && product) return `Serial device (VID: ${vendor}, PID: ${product})`
      return "Serial device"
    } catch {
      return "Serial device"
    }
  })

  async function request(filters?: any[]) {
    if (!serialSupported.value) throw new Error("Web Serial not supported")
    // @ts-expect-error lib typing
    serialPort.value = await navigator.serial.requestPort()
    selectedPortInfo = serialPort.value?.getInfo?.() ?? null
    // serialPort.value = await navigator.serial.requestPort(filters ? { filters } : {})
    return serialPort.value
  }

  function chunks(): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        readableStream.value = controller
      },
      cancel() {
        readableStream.value = null
      },
    })
  }

  async function startReading() {
    if (reading.value) return
    if (!serialPort.value?.readable) return

    reader.value = serialPort.value.readable.getReader()
    reading.value = true

    console.log("|SERIAL| Start Receiving data")

    let endedUnexpectedly = true
    try {
      while (reading.value) {
        const r = reader.value
        if (!r) break

        const { value, done } = await r.read()
        if (done) break
        if (value && value.length) readableStream.value?.enqueue(value)
      }
    } catch (err) {
      if (reading.value) console.error("|SERIAL| Received error:", err)
    } finally {
      endedUnexpectedly = reading.value
      reading.value = false
      try {
        reader.value?.releaseLock()
      } catch { }
      reader.value = null
      try {
        readableStream.value?.close()
      } catch { }
      readableStream.value = null
      if (endedUnexpectedly) void handleConnectionLost()
    }
  }

  async function openPort(nextStatus: ConnectionStatus) {
    if (!serialSupported.value) throw new Error("Web Serial not supported")
    if (!serialPort.value) await request()
    if (!serialPort.value) throw new Error("No serial port")

    status.value = nextStatus
    if (!serialPort.value.readable || !serialPort.value.writable) {
      await serialPort.value.open(settings.value)
    }
  }

  async function connect() {
    await openPort("connecting")
    status.value = "connected"
  }

  async function startRawReceiver(onData: (data: Uint8Array) => void) {
    const stream = chunks()
    void startReceive(stream, onData).catch(err => console.error("|SERIAL| Receive error:", err))
    void startReading()
  }

  async function start(onData: (data: Uint8Array) => void, options: StartOptions = {}) {
    startOptions = options
    keepReconnecting = true
    restartReceiver = () => startRawReceiver(onData)
    await openPort("connecting")
    await restartReceiver()
    status.value = "connected"
  }

  async function close() {
    keepReconnecting = false
    reconnecting = false
    restartReceiver = null
    startOptions = {}
    clearReconnectTimer()
    status.value = "disconnected"
    await stopReceive()
    if (serialPort.value) {
      try {
        await serialPort.value.close()
      } catch { }
    }
    serialPort.value = null
    selectedPortInfo = null
    return serialPort.value
  }

  async function stopReceive() {
    console.log("|SERIAL| Stop Receiving data")

    reading.value = false

    try {
      await reader.value?.cancel()
    } catch { }
    try {
      reader.value?.releaseLock()
    } catch { }
    reader.value = null

    try {
      readableStream.value?.close()
    } catch { }
    readableStream.value = null
  }

  function clearReconnectTimer() {
    if (!reconnectTimer) return
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  function scheduleReconnect() {
    if (!keepReconnecting || status.value !== "reconnecting" || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void attemptReconnect()
    }, 1000)
  }

  async function handleConnectionLost() {
    if (!keepReconnecting || status.value === "disconnected" || status.value === "reconnecting") return
    status.value = "reconnecting"
    startOptions.onDisconnect?.()
    await stopReceive()
    try {
      await serialPort.value?.close()
    } catch { }
    scheduleReconnect()
  }

  async function attemptReconnect() {
    if (!keepReconnecting || status.value !== "reconnecting" || reconnecting || !restartReceiver) return
    reconnecting = true
    clearReconnectTimer()
    try {
      // @ts-expect-error lib typing
      const ports: any[] = await navigator.serial.getPorts()
      const replacement = ports.find(port =>
        port !== serialPort.value
        && port.connected !== false
        && matchesSelectedPort(port)
      )
      if (replacement) serialPort.value = replacement

      await openPort("reconnecting")
      await restartReceiver()
      if (!keepReconnecting || status.value !== "reconnecting") return
      status.value = "connected"
      console.log("|SERIAL| Reconnected")
      await startOptions.onReconnect?.()
    } catch (err) {
      console.log("|SERIAL| Waiting for device to reconnect:", err)
      status.value = "reconnecting"
      scheduleReconnect()
    } finally {
      reconnecting = false
    }
  }

  function matchesSelectedPort(port: any) {
    if (!selectedPortInfo) return true
    const info = port?.getInfo?.()
    if (!info) return false
    return info.usbVendorId === selectedPortInfo.usbVendorId
      && info.usbProductId === selectedPortInfo.usbProductId
  }

  async function startReceive(stream: ReadableStream<Uint8Array>, onData: (data: Uint8Array) => void) {
    const r = stream.getReader()
    try {
      while (true) {
        const { value, done } = await r.read()
        if (done) break
        if (!value || value.length === 0) continue

        onData(value)
      }
    } finally {
      r.releaseLock()
    }
  }

  async function* rawChunkStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
    const r = stream.getReader()
    try {
      while (true) {
        const { value, done } = await r.read()
        if (done) break
        if (!value || value.length === 0) continue

        console.log(`|SERIAL| raw rx: ${toHex(value)}`)
        yield value
      }
    } finally {
      r.releaseLock()
    }
  }

  async function startMsgPackReceiver(onValue: (value: any) => void) {
    const stream = chunks()
    const cobsDec = cobsEncoding.createDecoder()
    void (async () => {
      for await (const chunk of rawChunkStream(stream)) {
        const frames = cobsDec.pushFrames(chunk)
        if (frames.length === 0) {
          console.log(`|SERIAL| cobs pending (no complete frame yet)`)
        }

        for (const frame of frames) {
          console.log(`|SERIAL| cobs decoded: ${toHex(frame)}`)
          try {
            const value = decode(frame)
            console.log('|SERIAL| msgpack:', JSON.stringify(value))
            onValue(value)
          } catch (err) {
            console.error(`|SERIAL| Invalid msgpack frame: ${toHex(frame)}`, err)
          }
        }
      }
    })().catch(err => console.error("|SERIAL| MessagePack receive error:", err))
    void startReading()

    await new Promise(resolve => setTimeout(resolve, SERIAL_STARTUP_DELAY_MS))
    if (!reading.value) throw new Error("Serial read stream is not available")
    cobsDec.reset()
    console.log(`|SERIAL| Ready after ${SERIAL_STARTUP_DELAY_MS}ms startup delay`)
  }

  async function startMsgPack(onValue: (value: any) => void, options: StartOptions = {}) {
    startOptions = options
    keepReconnecting = true
    restartReceiver = () => startMsgPackReceiver(onValue)
    await openPort("connecting")
    await restartReceiver()
    if (status.value !== "connecting") throw new Error("Serial device disconnected while connecting")
    status.value = "connected"
  }

  async function write(bytes: Uint8Array) {
    if (!serialPort.value?.writable) return

    const w = serialPort.value.writable.getWriter()
    try {
      await w.write(bytes)
    } finally {
      w.releaseLock()
    }
  }

  async function writeMsgpack(obj: any) {
    const raw = encode(obj)
    console.log(`|SERIAL| msgpack send: ${JSON.stringify(obj)} -> ${toHex(raw)}`)
    const frame = cobsEncoding.encodeFrame(raw)
    console.log(`|SERIAL| cobs frame send: ${toHex(frame)}`)
    await write(frame)
  }

  if (import.meta.client && serialSupported.value) {
    const onSerialDisconnect = (event: any) => {
      const port = event.port ?? event.target
      if (serialPort.value && port === serialPort.value) void handleConnectionLost()
    }
    const onSerialConnect = (event: any) => {
      const port = event.port ?? event.target
      if (status.value === "reconnecting" && port?.open && matchesSelectedPort(port)) {
        serialPort.value = port
        void attemptReconnect()
      }
    }

    // @ts-expect-error lib typing
    navigator.serial.addEventListener("disconnect", onSerialDisconnect)
    // @ts-expect-error lib typing
    navigator.serial.addEventListener("connect", onSerialConnect)

    onScopeDispose(() => {
      // @ts-expect-error lib typing
      navigator.serial.removeEventListener("disconnect", onSerialDisconnect)
      // @ts-expect-error lib typing
      navigator.serial.removeEventListener("connect", onSerialConnect)
      void close()
    })
  }

  return {
    isSupported,
    settings,
    status,
    connected,
    hasDevice,
    deviceName,
    request,
    connect,
    close,
    start,
    startMsgPack,
    write,
    writeMsgpack,
  }
}
