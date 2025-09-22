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
  const isSecure = computed(() => isClient && window.isSecureContext)
  const usbSupported = computed(() => isClient && 'usb' in navigator)
  const serialSupported = computed(() => isClient && 'serial' in navigator)
  const isSupported = computed(() => (usbSupported.value || serialSupported.value) && isSecure.value)

  const protocol = useState<'usb' | 'serial'>('usb.protocol', () => 'serial')
  const settings = useState<Settings>('usb.settings', () => defaultSettings)

  const usbDevice = ref<USBDevice | null>(null)
  const serialPort = ref<SerialPort | null>(null)
  const serialOpen = ref(false);

  const reader = ref<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const reading = ref(true);

  const queue = useState<Uint8Array[]>('usb.queue', () => [])
  const onDataCallbacks = new Set<(data: Uint8Array) => void>()

  const protocolOptions = computed<{ label: string, value: 'usb' | 'serial' }[]>(() => {
    const opts: { label: string; value: 'usb' | 'serial' }[] = []
    if (usbSupported.value) opts.push({ label: 'USB', value: 'usb' })
    if (serialSupported.value) opts.push({ label: 'Serial', value: 'serial' })
    return opts
  })

  const connected = computed<boolean>(() => {
    if (protocol.value === 'serial') return serialOpen.value
    if (protocol.value === 'usb') return !!usbDevice.value?.opened
    return false
  })

  const hasDevice = computed<boolean>(() => usbDevice || serialPort)

  const deviceName = computed(() => {
    if (protocol.value === 'usb') {
      if (!usbDevice.value) return 'No USB device'
      const { manufacturerName, productName } = usbDevice.value
      if (manufacturerName && productName) return `${manufacturerName} ${productName}`
      if (productName) return productName
      return 'Unknown USB device'
    }

    if (protocol.value === 'serial') {
      if (!serialPort.value) return 'No serial port'
      try {
        const info = serialPort.value.getInfo()
        const vendor = info.usbVendorId?.toString(16).padStart(4, '0')
        const product = info.usbProductId?.toString(16).padStart(4, '0')
        if (vendor && product) return `Serial device (VID: ${vendor}, PID: ${product})`
        return 'Serial device'
      } catch {
        return 'Serial device'
      }
    }

    return 'No device'
  })


  function onData(cb: (data: Uint8Array) => void) {
    onDataCallbacks.add(cb)
    return () => onDataCallbacks.delete(cb) // unsubscribe
  }

  function handleIncoming(data: Uint8Array) {
    queue.value.push(data)   // always enqueue
    onDataCallbacks.forEach(cb => cb(data)) // also trigger callbacks
  }

  async function request() {
    if (protocol.value === 'serial') return requestSerial()
    if (protocol.value === 'usb') return requestUsb()
  }

  async function requestUsb() {
    if (!usbSupported.value) throw new Error('WebUSB not supported')
    // @ts-expect-error lib typing
    usbDevice.value = await navigator.usb.requestDevice({ filters: [] })
    return usbDevice.value
  }

  async function requestSerial(filters?: SerialPortFilter[]) {
    if (!serialSupported.value) throw new Error('Web Serial not supported')
    // @ts-expect-error lib typing
    serialPort.value = await navigator.serial.requestPort(filters ? { filters } : {})
    return serialPort.value
  }

  async function connect() {
    if (protocol.value === 'serial') {
      await connectSerial();
    }

    if (protocol.value === 'usb') {
      await connectUsb();
    }

    startReceive();
  }

  async function connectUsb() {
    if (!usbSupported.value) throw new Error('WebUSB not supported')
    if (!usbDevice.value) await requestUsb()
    if (!usbDevice.value) throw new Error('No USB device')
    if (!usbDevice.value.opened) await usbDevice.value.open()
    return usbDevice.value
  }

  async function connectSerial() {
    if (!serialSupported.value) throw new Error('Web Serial not supported')
    if (!serialPort.value) await requestSerial()
    if (!serialPort.value) throw new Error('No serial port')
    if (!serialOpen.value) {
      await serialPort.value.open(settings.value)
      serialOpen.value = true
    }
    return serialPort.value
  }

  async function close() {
    if (protocol.value === 'serial') return closeSerial()
    if (protocol.value === 'usb') return closeUsb()
  }

  async function closeUsb() {
    if (usbDevice.value?.opened) await usbDevice.value.close()
    return usbDevice.value
  }

  async function closeSerial() {
    if (serialPort.value && serialOpen.value) {
      await serialPort.value.close()
      serialOpen.value = false
    }
    return serialPort.value
  }

  async function startReceive() {
    if (reading.value) return
    if (protocol.value === 'serial') startReceiveSerial()
    if (protocol.value === 'usb') startReceiveUsb()
  }

  async function startReceiveSerial() {
    if (!serialPort.value?.readable) return
    reader.value = serialPort.value.readable.getReader()
    reading.value = true

    try {
      while (reading.value) {
        if (reader.value === null) {
          break;
        }
        const { value, done } = await reader.value.read()
        if (done) {
          break;
        }
        if (value) {
          handleIncoming(value);
        }
      }
    } catch (err) {
      console.error('Serial receive error:', err)
    } finally {
      await stopReceive()
    }
  }

  async function startReceiveUsb() {
    if (!usbDevice.value) return
    if (!usbDevice.value.opened) await usbDevice.value.open()

    // these numbers depend on your device's descriptors
    const iface = 0
    const epIn = 2

    try {
      await usbDevice.value.selectConfiguration(1)
      await usbDevice.value.claimInterface(iface)
      reading.value = true

      while (reading.value) {
        const result = await usbDevice.value.transferIn(epIn, 64)
        if (result.data) {
          handleIncoming(result.data);
        }
      }
    } catch (err) {
      console.error('USB receive error:', err)
    } finally {
      reading.value = false
    }
  }

  async function stopReceive() {
    reading.value = false
    try { await reader.value?.cancel() } catch { }
    try { reader.value?.releaseLock() } catch { }
    reader.value = null
  }

  async function write(bytes: Uint8Array) {
    if (protocol.value === 'serial') {
      if (!serialPort.value?.writable) return
      const w = serialPort.value.writable.getWriter()
      await w.write(bytes); w.releaseLock(); return
    }
    if (protocol.value === 'usb' && usbDevice.value) {
      if (!usbDevice.value.opened) await usbDevice.value.open()
      await usbDevice.value.selectConfiguration(1)
      // await usbDevice.value.claimInterface(usbIface.value)
      // await usbDevice.value.transferOut(usbEpOut.value, bytes)
    }
  }

  if (import.meta.client && serialSupported.value) {
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('disconnect', (e: any) => {
      if (serialPort.value && e.port === serialPort.value) serialOpen.value = false
    })
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('connect', () => { serialOpen.value = true })
  }

  return {
    isSupported,
    protocolOptions,
    protocol,
    settings,
    connected,
    hasDevice,
    deviceName,
    request,
    connect,
    close,
    onData,
    write,
  }
}
