import { decodeMultiStream, encode } from "@msgpack/msgpack"

export type Settings = {
  baudRate: number,
  dataBits: 7 | 8,
  stopBits: 1 | 2,
  parity: 'none' | 'even' | 'odd',
  bufferSize: number,
  flowControl: 'none' | 'hardware'
}

const defaultSettings: Settings = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 255,
  flowControl: 'none'
}

export const useUsb = () => {
  const isClient = typeof window !== 'undefined'

  const settings = useState<Settings>('serial.settings', () => defaultSettings)

  const serialPort = ref<any | null>(null)
  const reader = ref<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const readableStream = ref<ReadableStreamDefaultController<Uint8Array> | null>(null)
  const reading = ref(false);
  const connected = ref(false);

  const isSecure = computed(() => isClient && window.isSecureContext)
  const serialSupported = computed(() => isClient && 'serial' in navigator)
  const isSupported = computed(() => serialSupported.value && isSecure.value)
  const hasDevice = computed<boolean>(() => serialPort.value !== null)

  const deviceName = computed(() => {
    if (!serialPort.value) {
      return 'No serial port'
    }
    try {
      const info = serialPort.value?.getInfo()
      const vendor = info.usbVendorId?.toString(16).padStart(4, '0')
      const product = info.usbProductId?.toString(16).padStart(4, '0')
      if (vendor && product) {
        return `Serial device (VID: ${vendor}, PID: ${product})`
      }
      return 'Serial device'
    } catch {
      return 'Serial device'
    }
  })

  async function request(filters?: any[]) {
    if (!serialSupported.value) {
      throw new Error('Web Serial not supported')
    }
    console.log("|SERIAL| Request port")
    // @ts-expect-error lib typing
    serialPort.value = await navigator.serial.requestPort(filters ? { filters } : {})
    return serialPort.value
  }

  async function connect() {
    if (!serialSupported.value) {
      throw new Error('Web Serial not supported')
    }
    if (!serialPort.value) {
      await request()
    }
    if (!serialPort.value) {
      throw new Error('No serial port')
    }
    if (!connected.value) {
      console.log("|SERIAL| Connecting")
      await serialPort.value.open(settings.value)
      connected.value = true
    }

    startReading();
  }

  async function start(onData: (data: Uint8Array) => void) {
    await connect();
    startReceive(onData);
  }

  async function startMsgPack(onValue: (v: any) => void) {
    await connect();
    startReceiveMsgpack(onValue);
  }

  async function close() {
    console.log("|SERIAL| Close connection");
    await stopReceive();
    if (serialPort.value && connected.value) {
      try {
        await serialPort.value.close()
      }
      catch { }
      connected.value = false
    }
    return serialPort.value
  }

  function chunks(): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        readableStream.value = controller
      },
      cancel() {
        readableStream.value = null
      }
    })
  }

  async function startReading() {
    if (reading.value) return
    if (!serialPort.value?.readable) return
    reader.value = serialPort.value.readable.getReader()
    reading.value = true
    console.log("|SERIAL| Start receiving data")

    try {
      while (reading.value) {
        if (reader.value === null) {
          console.log("|SERIAL| Reader null")
          break;
        }
        const { value, done } = await reader.value.read()
        if (done) {
          console.log("|SERIAL| Closing reader")
          break;
        }
        if (value) {
          console.log(value)
          readableStream.value?.enqueue(value);
        }
      }
    } catch (err) {
      console.error('|SERIAL| Received error:', err)
    } finally {
      await stopReceive()
    }
  }

  async function startReceive(onData: (data: Uint8Array) => void) {
    const reader = chunks().getReader()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        onData?.(value)
      }
    }
    finally {
      reader.releaseLock();
    }
  }

  async function startReceiveMsgpack(onValue: (value: any) => void) {
    const stream = chunks()
    try {
      for await (const v of decodeMultiStream(stream)) {
        console.log(`We got a value ${v}`)
        onValue(v)
      }
    }
    finally {
      try {
        stream.cancel();
      }
      catch {
      }
    }
  }

  async function stopReceive() {
    console.log("|SERIAL| Stop receiving")
    reading.value = false
    try { await reader.value?.cancel() } catch { }
    try { reader.value?.releaseLock() } catch { }
    reader.value = null
    try { readableStream.value?.close() } catch { }
  }

  async function write(bytes: Uint8Array) {
    if (!serialPort.value?.writable) {
      return
    }
    console.log("|SERIAL| Writing bytes");
    const w = serialPort.value.writable.getWriter()
    await w.write(bytes); w.releaseLock();
  }

  if (import.meta.client && serialSupported.value) {
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('disconnect', (e: any) => {
      if (serialPort.value && e.port === serialPort.value) connected.value = false
    })
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('connect', () => { connected.value = true })
  }

  async function writeMsgpack(obj: any) {
    const bytes = encode(obj);
    write(bytes);
  }

  return {
    isSupported,
    settings,
    connected,
    hasDevice,
    deviceName,
    request,
    connect,
    close,
    start,
    startMsgPack,
    write,
    writeMsgpack
  }
}
