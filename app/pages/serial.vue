<script setup lang="ts">
type SPort = SerialPort & { __id?: string }
const supported = ref(typeof navigator !== 'undefined' && 'serial' in navigator)
const ports = ref<SPort[]>([])
const selected = ref<string | null>(null)
const baud = ref(115200)
const baudOptions = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]
const port = shallowRef<SPort | null>(null)
const reader = shallowRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
const writer = shallowRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)
const autoNL = ref(true)
const line = ref("")
const log = ref<string[]>([])
const busy = ref(false)

const idOf = (p: SPort) => {
    const i = p.getInfo?.() as any
    const vid = i?.usbVendorId ?? 'n/a', pid = i?.usbProductId ?? 'n/a'
    return `vid:${vid} pid:${pid}`
}

async function refresh() {
    if (!supported.value) return
    const list = await (navigator as any).serial.getPorts() as SPort[]
    list.forEach((p, i) => (p.__id = `${i}:${idOf(p)}`))
    ports.value = list
    if (!selected.value && list.length) selected.value = list[0].__id!
}

async function requestPort() {
    const p = await (navigator as any).serial.requestPort() as SPort
    p.__id = `req:${Date.now()}:${idOf(p)}`
    ports.value.push(p)
    selected.value = p.__id!
}

const getSel = () => ports.value.find(p => p.__id === selected.value) ?? null

async function connect() {
    const sel = getSel(); if (!sel) return
    busy.value = true
    try {
        await sel.open({ baudRate: baud.value })
        writer.value = sel.writable?.getWriter() ?? null
        port.value = sel
        readLoop()
        push(`[OPEN] ${idOf(sel)} @ ${baud.value}`)
    } catch (e: any) { push(`[ERR] ${e.message || e}`) } finally { busy.value = false }
}

async function readLoop() {
    if (!port.value?.readable) return
    const dec = new TextDecoder()
    reader.value = port.value.readable.getReader()
    try {
        for (; ;) {
            const { value, done } = await reader.value.read()
            if (done) break
            if (value?.length) push(dec.decode(value))
        }
    } catch (e: any) { push(`[RX ERR] ${e.message || e}`) } finally { reader.value?.releaseLock() }
}

async function send() {
    if (!writer.value || !line.value) return
    const payload = autoNL.value && !line.value.endsWith("\n") ? line.value + "\n" : line.value
    await writer.value.write(new TextEncoder().encode(payload))
    push("> " + line.value)
    line.value = ""
}

async function disconnect() {
    try { await reader.value?.cancel() } catch { }
    try { await writer.value?.close() } catch { }
    try { writer.value?.releaseLock() } catch { }
    try { await port.value?.close() } catch { }
    reader.value = null; writer.value = null; port.value = null
    push("[CLOSE]")
}

function clearLog() { log.value = [] }
function push(s: string) { log.value.push(s); if (log.value.length > 1000) log.value.shift() }

onMounted(() => {
    refresh()
    try {
        (navigator as any).serial.addEventListener?.("connect", refresh)
            (navigator as any).serial.addEventListener?.("disconnect", refresh)
    } catch { }
})
onBeforeUnmount(disconnect)
</script>

<template>
    <UContainer class="py-6">
        <template v-if="supported">
            <div class="flex flex-wrap items-center gap-2 mb-4">
                <UButton color="gray" @click="refresh">Refresh</UButton>
                <UButton color="primary" @click="requestPort">Request Port</UButton>
                <USelect v-model="selected" :options="ports.map(p => ({ label: p.__id, value: p.__id }))"
                    placeholder="Select port" class="w-80" />
                <USelect v-model="baud" :options="baudOptions" class="w-28" />
                <div class="flex items-center gap-1">
                    <USwitch v-model="autoNL" />
                    <span class="text-sm text-gray-500">Auto-\n</span>
                </div>
                <UButton :loading="busy" :disabled="!selected || port" @click="connect">Connect</UButton>
                <UButton color="red" variant="soft" :disabled="!port" @click="disconnect">Disconnect</UButton>
                <UButton color="gray" variant="soft" @click="clearLog">Clear</UButton>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
                <UCard>
                    <template #header>Available Ports</template>
                    <UTable :rows="ports.map(p => ({ id: p.__id, info: idOf(p) }))"
                        :columns="[{ id: 1, key: 'id', label: 'ID' }, { id: 2, key: 'info', label: 'Info' }]" />
                </UCard>

                <UCard>
                    <template #header>Send</template>
                    <div class="flex gap-2">
                        <UInput v-model="line" placeholder="Type and press Enter" class="flex-1" @keyup.enter="send" />
                        <UButton :disabled="!writer" @click="send">Send</UButton>
                    </div>
                </UCard>
            </div>

            <UCard class="mt-4">
                <template #header>Console</template>
                <div class="h-96 overflow-auto whitespace-pre-wrap font-mono text-sm p-2 bg-gray-50 rounded">
                    {{ log.join('\n') }}
                </div>
            </UCard>
        </template>

        <UAlert v-else color="red" title="Web Serial not supported" description="Open in Chrome or Edge on desktop."
            class="my-6" />
    </UContainer>
</template>
