type Bool = { id: string; label: string; type: 'bool'; value: boolean; readonly?: boolean }
type Num = { id: string; label: string; type: 'int' | 'float' | 'range'; value: number; min?: number; max?: number; step?: number; unit?: string; readonly?: boolean }
type Str = { id: string; label: string; type: 'string'; value: string; readonly?: boolean }
type Enm = { id: string; label: string; type: 'enum'; value: string | number; options: (string | number)[]; readonly?: boolean }
type Setting = Bool | Num | Str | Enm
type Group = { id: string; label: string; settings: Setting[] }
type Payload = { deviceInfo?: { model?: string; fw?: string }, groups: Group[] }


export const useConfigurator = () => {
  const transport = useState<'WebUSB' | 'WebSerial'>('config.transport', () => 'WebUSB')
  const connected = useState('config.connected', () => false)
  const busy = useState('config.busy', () => false)
  const payload = useState<Payload>('config.payload', () => ({ deviceInfo: {}, groups: [] }))
  const defaults = useState<Record<string, any>>('config.defaults', () => ({}))
  const values = useState<Record<string, any>>('config.values', () => ({}))

  const isDirty = computed(() => Object.keys(values.value).some(k => values.value[k] !== defaults.value[k]))
  const isSettingDirty = (id: string) => values.value[id] !== defaults.value[id]
  const groupDirty = (gid: string) => payload.value.groups.find(g => g.id === gid)?.settings.some(s => isSettingDirty(s.id)) || false

  function inputFor(s: Setting) {
    if (s.type === 'bool') return resolveComponent('USwitch')
    if (s.type === 'enum') return resolveComponent('USelect')
    if (s.type === 'range') return resolveComponent('USlider')
    return resolveComponent('UInput')
  }
  function inputProps(s: Setting) {
    if (s.type === 'bool') return { disabled: s.readonly }
    if (s.type === 'enum') return { options: (s as Enm).options, disabled: s.readonly }
    const p: any = { type: s.type === 'string' ? 'text' : 'number', step: (s as any).step ?? 1, disabled: s.readonly }
    if ('min' in s && s.min !== undefined) p.min = s.min
    if ('max' in s && s.max !== undefined) p.max = s.max
    return p
  }

  function loadPayload(p: Payload) {
    payload.value = p
    defaults.value = {}; values.value = {}
    for (const g of p.groups) for (const s of g.settings) {
      defaults.value[s.id] = (s as any).value
      values.value[s.id] = (s as any).value
    }
  }

  async function connect() {
    if (connected.value) { connected.value = false; return }
    busy.value = true
    try {
      // TODO: real connect logic
      connected.value = true
      await readAll()
    } finally { busy.value = false }
  }

  async function readAll() {
    // Demo payload
    const demo: Payload = {
      deviceInfo: { model: 'IM-42', fw: '1.3.0' },
      groups: [
        {
          id: 'motion', label: 'Motion', settings: [
            { id: 'closed_loop', label: 'Closed Loop', type: 'bool', value: true },
            { id: 'max_rpm', label: 'Max RPM', type: 'int', min: 0, max: 12000, step: 100, unit: 'RPM', value: 3500 },
            { id: 'accel', label: 'Acceleration', type: 'float', min: 0, max: 50, step: 0.1, unit: 'krpm/s', value: 3.5 },
            { id: 'profile', label: 'Profile', type: 'enum', options: ['Quiet', 'Balanced', 'Aggressive'], value: 'Balanced' }
          ]
        },
        {
          id: 'io', label: 'I/O', settings: [
            { id: 'invert_dir', label: 'Invert Direction', type: 'bool', value: false },
            { id: 'baud', label: 'Baud Rate', type: 'enum', options: [115200, 230400, 460800, 921600], value: 115200 }
          ]
        }
      ]
    }
    loadPayload(demo)
  }

  async function writeAll() {
    const changes: Record<string, any> = {}
    for (const k in values.value) if (values.value[k] !== defaults.value[k]) changes[k] = values.value[k]
    console.log('Writing changes to device (demo):', changes)
    Object.assign(defaults.value, changes)
  }

  function resetGroup(gid: string) {
    const g = payload.value.groups.find(x => x.id === gid); if (!g) return
    for (const s of g.settings) values.value[s.id] = defaults.value[s.id]
  }

  return {
    transport, connected, busy, payload, values, defaults,
    isDirty, isSettingDirty, groupDirty, inputFor, inputProps,
    loadPayload, connect, readAll, writeAll, resetGroup
  }
}
