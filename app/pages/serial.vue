<script setup lang="ts">
const message = ref<string>('')

useHead({
    title: 'Serial monitor ~ Integral Motions',
    meta: [
        { name: 'description', content: 'A serial monitor in the browser you can use from anywhere' }
    ]
})

const usb = useUsb()
const uiPreferences = useState('serial.uiPreferences', () => ({
    autoScroll: true,
    timestamps: false,
    sendOnEnter: true,
    hexView: false
}))

async function toggleConnect() {
    if (usb.connected.value) {
        usb.close()
    }
    else {
        usb.start(receive)
    }
}

async function send() {
    const bytes = new TextEncoder().encode(message.value);
    data.value += `> ${message.value}\n`
    message.value = '';
    usb.write(bytes)
}

function receive(received: Uint8Array<ArrayBufferLike>) {
    console.log(new TextDecoder().decode(received))
    data.value += new TextDecoder().decode(received)
}

const data = ref('')

</script>

<template>
    <UnsupportedBrowser>

        <template v-if="usb.isSupported.value">
            <ScrollContent>
                <template #header>
                    <div class="flex">
                        <ScrollContent :horizontal="true">
                            <template #header>
                                <UChip standalone inset class="mr-2" :color="usb.connected.value ? 'success' : 'error'">
                                </UChip>
                                {{ usb.deviceName.value }}
                            </template>
                        </ScrollContent>
                    </div>
                </template>
                <template #default>
                    <SerialOutput :text="data" :auto-scroll="true" :wrap="true" class="flex-1 my-4" />
                </template>
                <template #footer>
                    <div class="flex">
                        <UModal title="Settings"
                            description="Settings for connecting to the serial port of the connected device">
                            <UButton icon="i-ph-gear-six" variant="ghost" size="lg" class="mr-4" />

                            <template #body>
                                <UTabs :items="[{
                                    label: 'Serial Settings',
                                    icon: 'material-symbols:usb-rounded',
                                    slot: 'serial'
                                },
                                {
                                    label: 'Ui Settings',
                                    icon: 'material-symbols:display-settings-outline-rounded',
                                    slot: 'ui'
                                }]">
                                    <template #serial>
                                        <div class="grid grid-cols-2 gap-4">
                                            <UFormField label="Baud Rate">
                                                <USelect v-model="usb.settings.value.baudRate"
                                                    :options="[9600, 115200, 250000]" class="w-full" />
                                            </UFormField>

                                            <UFormField label="Flow Control">
                                                <USelect v-model="usb.settings.value.flowControl"
                                                    :options="['none', 'hardware']" class="w-full" />
                                            </UFormField>

                                            <UFormField label="Data Bits">
                                                <USelect v-model="usb.settings.value.dataBits" :options="[7, 8]"
                                                    class="w-full" />
                                            </UFormField>

                                            <UFormField label="Stop Bits">
                                                <USelect v-model="usb.settings.value.stopBits" :options="[1, 2]"
                                                    class="w-full" />
                                            </UFormField>

                                            <UFormField label="Parity">
                                                <USelect v-model="usb.settings.value.parity"
                                                    :options="['none', 'even', 'odd']" class="w-full" />
                                            </UFormField>

                                            <UFormField label="Buffer Size">
                                                <UInput v-model.number="usb.settings.value.bufferSize" type="number"
                                                    class="w-full" />
                                            </UFormField>
                                        </div>
                                    </template>
                                    <template #ui>
                                        <div class="grid grid-cols-2 gap-4">
                                            <UFormField label="Auto scroll">
                                                <USwitch v-model="uiPreferences.autoScroll" />
                                            </UFormField>
                                            <UFormField label="Show timestamps">
                                                <USwitch v-model="uiPreferences.timestamps" />
                                            </UFormField>
                                            <UFormField label="Send on Enter">
                                                <USwitch v-model="uiPreferences.sendOnEnter" />
                                            </UFormField>
                                            <UFormField label="Hex view">
                                                <USwitch v-model="uiPreferences.hexView" />
                                            </UFormField>
                                        </div>
                                    </template>
                                </UTabs>
                            </template>
                        </UModal>

                        <UButton icon="material-symbols:delete-outline-rounded" variant="ghost" size="lg" class="mr-4"
                            @click="(_) => { data = ''; }" />

                        <UInput v-model="message" placeholder="Type a command…" size="xl" class="flex-1"
                            @keyup.enter="send">
                            <template #trailing>
                                <UButton icon="i-ph-paper-plane-tilt" size="sm" variant="ghost" @click="send" />
                            </template>
                        </UInput>

                        <!-- Connect / Disconnect -->
                        <UButton :color="usb.connected.value ? 'error' : 'primary'"
                            :icon="usb.connected.value ? 'material-symbols:power-plug-off-rounded' : 'material-symbols:power-plug-rounded'"
                            @click="toggleConnect" class="ml-4">
                            {{ usb.connected.value ? 'Disconnect' : 'Connect' }}
                        </UButton>
                    </div>
                </template>
            </ScrollContent>
        </template>
    </UnsupportedBrowser>
</template>
