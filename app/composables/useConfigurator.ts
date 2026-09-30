const WRITE_TIMEOUT_MS = 5000

type ChangedSetting = {
  address: number
  type: SettingType
  key: string
  value: boolean | number
}

export const useConfigurator = () => {
  const usb = useUsb()
  const sessionActive = ref(false)
  const busy = ref(false)
  const writing = ref(false)
  const writeError = ref<string | null>(null)
  const device = useState<Device>('config.payload', () => ({
    deviceInfo: { model: null, firmwareVersion: null },
    modules: [],
  }))
  const defaults = useState<Record<string, any>>('config.defaults', () => ({}))
  const values = useState<Record<string, any>>('config.values', () => ({}))
  const fieldErrors = useState<Record<string, string>>('config.fieldErrors', () => ({}))
  const connected = usb.connected
  const reconnecting = computed(() => usb.status.value === 'reconnecting')
  let addressMap: Record<number, string> = {}
  let preservedChanges: Record<string, any> = {}
  let pendingWrite: {
    resolve: (result: WriteSettingsResponse) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  } | null = null

  const settingKey = (moduleId: string, groupId: string, settingId: string) =>
    JSON.stringify([moduleId, groupId, settingId])
  const isDirty = computed(() => Object.keys(values.value).some(k => values.value[k] !== defaults.value[k]))
  const isSettingDirty = (moduleId: string, groupId: string, settingId: string) => {
    const key = settingKey(moduleId, groupId, settingId)
    return values.value[key] !== defaults.value[key]
  }
  const moduleDirty = (moduleId: string) => device.value.modules
    .find(module => module.id === moduleId)?.groups
    .some(group => group.settings.some(setting => isSettingDirty(moduleId, group.id, setting.value.id))) || false
  const groupDirty = (moduleId: string, groupId: string) => device.value.modules
    .find(module => module.id === moduleId)?.groups
    .find(group => group.id === groupId)?.settings
    .some(setting => isSettingDirty(moduleId, groupId, setting.value.id)) || false
  const failedCount = computed(() => Object.keys(fieldErrors.value).length)

  function setValue(moduleId: string, groupId: string, settingId: string, value: boolean | number) {
    const key = settingKey(moduleId, groupId, settingId)
    values.value[key] = value
    if (Object.hasOwn(fieldErrors.value, key)) {
      const next = { ...fieldErrors.value }
      delete next[key]
      fieldErrors.value = next
    }
  }

  function loadDevice(p: Device) {
    device.value = p
    defaults.value = {}; values.value = {}
    const seen = new Map<number, string>()
    for (const m of p.modules) {
      for (const g of m.groups) {
        for (const s of g.settings) {
          const key = settingKey(m.id, g.id, s.value.id)
          defaults.value[key] = s.value.value
          values.value[key] = s.value.value
          if (!s.value.readonly && Object.hasOwn(preservedChanges, key)) {
            values.value[key] = preservedChanges[key]
          }
          const existing = seen.get(s.value.address)
          if (existing !== undefined && existing !== key) {
            console.error(`|CONFIGURATOR| Duplicate address ${s.value.address} for "${existing}" and "${key}"`)
            writeError.value = `Duplicate setting address ${s.value.address}.`
          } else {
            seen.set(s.value.address, key)
          }
        }
      }
    }
    addressMap = Object.fromEntries(seen)
    preservedChanges = {}
  }

  async function connect() {
    if (sessionActive.value) {
      sessionActive.value = false
      preservedChanges = {}
      rejectPendingWrite(new Error('Disconnected while writing'))
      await usb.close()
      return
    }
    busy.value = true
    writeError.value = null
    fieldErrors.value = {}
    try {
      await usb.startMsgPack(receive, {
        onDisconnect: handleUnexpectedDisconnect,
        onReconnect: handleReconnect,
      })
      sessionActive.value = true
      await readAll()
    } catch (error) {
      sessionActive.value = false
      writeError.value = error instanceof Error ? error.message : 'Connecting to the device failed.'
      await usb.close()
    } finally {
      busy.value = false
    }
  }

  function handleUnexpectedDisconnect() {
    preservedChanges = Object.fromEntries(
      Object.keys(values.value)
        .filter(key => values.value[key] !== defaults.value[key])
        .map(key => [key, values.value[key]])
    )
    rejectPendingWrite(new Error('Device disconnected while writing'))
  }

  async function handleReconnect() {
    await readAll()
  }

  async function readAll() {
    if (usb.connected.value) {
      await usb.writeMsgpack(READ_DEVICE_REQUEST)
    }
  }

  function collectChangedSettings(): ChangedSetting[] {
    const changed: ChangedSetting[] = []
    for (const m of device.value.modules) {
      for (const g of m.groups) {
        for (const s of g.settings) {
          const key = settingKey(m.id, g.id, s.value.id)
          if (s.value.readonly) continue
          if (!isSettingDirty(m.id, g.id, s.value.id)) continue
          changed.push({
            address: s.value.address,
            type: s.type,
            key,
            value: values.value[key],
          })
        }
      }
    }
    return changed
  }

  function toWriteSetting(c: ChangedSetting): WriteSetting {
    return {
      address: c.address,
      type: c.type,
      value: { value: c.value },
    }
  }

  async function writeAll() {
    if (writing.value) return
    const changed = collectChangedSettings()
    if (changed.length === 0) return

    writing.value = true
    writeError.value = null
    try {
      const resultPromise = waitForWriteResult()
      const request = createWriteSettingsRequest(changed.map(toWriteSetting))
      console.log('|CONFIGURATOR| Writing settings:', request)
      await usb.writeMsgpack(request)
      const result = await resultPromise

      const responded = new Set<number>()
      const nextErrors: Record<string, string> = {}
      const rejected = new Map<string, boolean | number>()

      for (const entry of result.values) {
        const key = addressMap[entry.address]
        if (key === undefined) {
          console.error(`|CONFIGURATOR| Write result for unknown address ${entry.address}`)
          continue
        }
        responded.add(entry.address)
        if (!entry.success) {
          nextErrors[key] = entry.errorMessage || 'The device rejected this value.'
          rejected.set(key, values.value[key])
        }
      }

      for (const c of changed) {
        if (responded.has(c.address)) continue
        nextErrors[c.key] = 'The device did not confirm this write.'
        rejected.set(c.key, values.value[c.key])
      }

      fieldErrors.value = nextErrors
      preservedChanges = Object.fromEntries(rejected)
      await readAll()
    } catch (error) {
      rejectPendingWrite(error instanceof Error ? error : new Error('Writing settings failed.'))
      writeError.value = error instanceof Error ? error.message : 'Writing settings failed.'
      console.error('|CONFIGURATOR| Write failed:', error)
    } finally {
      writing.value = false
    }
  }

  function waitForWriteResult(): Promise<WriteSettingsResponse> {
    rejectPendingWrite(new Error('A newer write request replaced the previous request'))

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingWrite = null
        reject(new Error(`The device did not confirm the write within ${WRITE_TIMEOUT_MS}ms.`))
      }, WRITE_TIMEOUT_MS)

      pendingWrite = { resolve, reject, timeout }
    })
  }

  function rejectPendingWrite(error: Error) {
    if (!pendingWrite) return
    clearTimeout(pendingWrite.timeout)
    pendingWrite.reject(error)
    pendingWrite = null
  }

  function resetGroup(mid: string, gid: string) {
    const g = device.value.modules.find(m => m.id === mid)?.groups.find(x => x.id === gid)

    if (!g) {
      return
    }

    for (const s of g.settings) {
      const key = settingKey(mid, gid, s.value.id)
      values.value[key] = defaults.value[key]
      if (Object.hasOwn(fieldErrors.value, key)) {
        const next = { ...fieldErrors.value }
        delete next[key]
        fieldErrors.value = next
      }
    }
  }

  function receive(message: any) {
    console.log('Received message:', message)
    if (message?.opCode === 'read.device' && message.msgType === 'response' && message.payload) {
      loadDevice(message.payload)
      return
    }

    if (message?.opCode === 'write.settings' && message.msgType === 'response' && message.payload && pendingWrite) {
      clearTimeout(pendingWrite.timeout)
      pendingWrite.resolve(message.payload)
      pendingWrite = null
    }
  }

  onScopeDispose(() => rejectPendingWrite(new Error('Configurator closed while writing')))

  return {
    connected, reconnecting, sessionActive, busy, writing, writeError, payload: device, values, defaults,
    isDirty, isSettingDirty, moduleDirty, groupDirty, settingKey, fieldErrors, failedCount, setValue,
    loadPayload: loadDevice, connect, readAll, writeAll, resetGroup
  }
}