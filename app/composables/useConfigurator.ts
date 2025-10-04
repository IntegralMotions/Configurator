import { Decoder, encode } from "@msgpack/msgpack"

export const useConfigurator = () => {
  const usb = useUsb();
  const transport = useState<'WebUSB' | 'WebSerial'>('config.transport', () => 'WebUSB')
  const connected = useState('config.connected', () => false)
  const busy = useState('config.busy', () => false)
  const device = useState<Device>('config.payload', () => ({ deviceInfo: {}, modules: [] }))
  const defaults = useState<Record<string, any>>('config.defaults', () => ({}))
  const values = useState<Record<string, any>>('config.values', () => ({}))

  const isDirty = computed(() => Object.keys(values.value).some(k => values.value[k] !== defaults.value[k]))
  const isSettingDirty = (id: string) => values.value[id] !== defaults.value[id]
  const moduleDirty = (mid: string) => device.value.modules.find(m => m.id === mid)?.groups.some(g => g.settings.some(s => isSettingDirty(s.id))) || false
  const groupDirty = (mid: string, gid: string) => device.value.modules.find(m => m.id === mid)?.groups.find(g => g.id == gid)?.settings.some(s => isSettingDirty(s.id)) || false

  const decoder = new Decoder()
  var buffer = new Uint8Array()

  function loadDevice(p: Device) {
    device.value = p
    defaults.value = {}; values.value = {}
    for (const m of p.modules) {
      for (const g of m.groups) {
        for (const s of g.settings) {
          defaults.value[s.id] = (s as any).value
          values.value[s.id] = (s as any).value
        }
      }
    }
  }

  async function connect() {
    if (connected.value) {
      connected.value = false;
      await usb.close();
      return
    }
    busy.value = true
    try {
      connected.value = true
      await usb.startMsgPack(receive);
      await readAll()
    } finally { busy.value = false }
  }

  async function readAll() {
    if (usb.connected.value) {
      const bytes = encode(READ_DEVICE_REQUEST);
      usb.write(bytes);
    }
  }

  async function writeAll() {
    const changes: Record<string, any> = {}
    for (const k in values.value) if (values.value[k] !== defaults.value[k]) {
      changes[k] = values.value[k]
    }
    console.log('Writing changes to device (demo):', changes)
    Object.assign(defaults.value, changes)
  }

  function resetGroup(mid: string, gid: string) {
    const g = device.value.modules.find(m => m.id === mid)?.groups.find(x => x.id === gid);

    if (!g) {
      return
    }

    for (const s of g.settings) {
      values.value[s.id] = defaults.value[s.id]
    }
  }

  function receive(value: any) {
    console.log(value);
    loadDevice(value);
  }

  function concat(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(a.length + b.length)
    out.set(a)
    out.set(b, a.length)
    return out
  }

  return {
    transport, connected, busy, payload: device, values, defaults,
    isDirty, isSettingDirty, moduleDirty, groupDirty,
    loadPayload: loadDevice, connect, readAll, writeAll, resetGroup
  }
}
