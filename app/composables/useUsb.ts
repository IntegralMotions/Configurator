// composables/useUsb.ts
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
  const serialOpen = ref(false)

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
    if (protocol.value === 'serial') return connectSerial()
    if (protocol.value === 'usb') return connectUsb()
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

  if (process.client && serialSupported.value) {
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('disconnect', (e: any) => {
      if (serialPort.value && e.port === serialPort.value) serialOpen.value = false
    })
    // @ts-expect-error lib typing
    navigator.serial.addEventListener('connect', () => { /* optional: refresh list */ })
  }

  return {
    isSupported,
    protocolOptions,
    protocol,
    settings,
    connected,
    request,
    connect,
    close,
  }
}
