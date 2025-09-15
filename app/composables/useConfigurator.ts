
export const useConfigurator = () => {
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
      return
    }
    busy.value = true
    try {
      // TODO: real connect logic
      connected.value = true
      await readAll()
    } finally { busy.value = false }
  }

  async function readAll() {
    // Demo payload
    const demo: Device = {
      "deviceInfo": {
        "model": "X2000",
        "fw": "2.5.0"
      },
      "modules": [
        {
          "id": "m1",
          "label": "Power Module",
          "groups": [
            {
              "id": "g1",
              "label": "General",
              "settings": [
                {
                  "address": 1,
                  "id": "s1",
                  "label": "Enable Output",
                  "type": "bool",
                  "value": true
                },
                {
                  "address": 2,
                  "id": "s2",
                  "label": "Operating Mode",
                  "type": "options",
                  "value": "auto",
                  "options": ["auto", "manual", "standby"]
                }
              ]
            },
            {
              "id": "g2",
              "label": "Voltage",
              "settings": [
                {
                  "address": 3,
                  "id": "s3",
                  "label": "Nominal Voltage",
                  "type": "float",
                  "value": 12.0,
                  "unit": "V",
                  "min": 0,
                  "max": 24,
                  "step": 0.1
                },
                {
                  "address": 4,
                  "id": "s4",
                  "label": "Voltage Range",
                  "type": "range",
                  "value": 5,
                  "unit": "V",
                  "min": 0,
                  "max": 10,
                  "step": 0.5
                }
              ]
            },
            {
              "id": "g3",
              "label": "Current",
              "settings": [
                {
                  "address": 5,
                  "id": "s5",
                  "label": "Current Limit",
                  "type": "int",
                  "value": 8,
                  "unit": "A",
                  "min": 0,
                  "max": 20,
                  "step": 1
                },
                {
                  "address": 6,
                  "id": "s6",
                  "label": "Measured Current",
                  "type": "float",
                  "value": 7.2,
                  "unit": "A",
                  "readonly": true
                }
              ]
            }
          ]
        },
        {
          "id": "m2",
          "label": "Communication Module",
          "groups": [
            {
              "id": "g4",
              "label": "Serial",
              "settings": [
                {
                  "address": 10,
                  "id": "s7",
                  "label": "Baud Rate",
                  "type": "options",
                  "value": 115200,
                  "options": [9600, 19200, 38400, 57600, 115200]
                },
                {
                  "address": 11,
                  "id": "s8",
                  "label": "Parity",
                  "type": "options",
                  "value": "none",
                  "options": ["none", "even", "odd"]
                }
              ]
            },
            {
              "id": "g5",
              "label": "Network",
              "settings": [
                {
                  "address": 12,
                  "id": "s9",
                  "label": "Device Name",
                  "type": "string",
                  "value": "Controller-01"
                },
                {
                  "address": 13,
                  "id": "s10",
                  "label": "IP Address",
                  "type": "string",
                  "value": "192.168.1.100"
                },
                {
                  "address": 14,
                  "id": "s11",
                  "label": "MAC Address",
                  "type": "string",
                  "value": "00:1A:2B:3C:4D:5E",
                  "readonly": true
                }
              ]
            }
          ]
        },
        {
          "id": "m3",
          "label": "Diagnostics Module",
          "groups": [
            {
              "id": "g6",
              "label": "Status",
              "settings": [
                {
                  "address": 20,
                  "id": "s12",
                  "label": "Temperature",
                  "type": "float",
                  "value": 42.3,
                  "unit": "°C",
                  "readonly": true
                },
                {
                  "address": 21,
                  "id": "s13",
                  "label": "Uptime",
                  "type": "int",
                  "value": 3600,
                  "unit": "s",
                  "readonly": true
                },
                {
                  "address": 22,
                  "id": "s14",
                  "label": "Error Flags",
                  "type": "options",
                  "value": 0,
                  "options": [0, 1, 2, 4, 8],
                  "readonly": true
                }
              ]
            }
          ]
        }
      ]
    }
    loadDevice(demo)
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

  return {
    transport, connected, busy, payload: device, values, defaults,
    isDirty, isSettingDirty, moduleDirty, groupDirty,
    loadPayload: loadDevice, connect, readAll, writeAll, resetGroup
  }
}
