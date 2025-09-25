<template>
  <UModal v-model="open">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Serial Settings</h3>
          <UButton icon="i-ph-x" variant="ghost" @click="open = false" />
        </div>
      </template>

      <div class="grid gap-6 md:grid-cols-2">
        <UFormGroup label="Baud Rate">
          <USelect v-model="model.baudRate" :options="[9600, 115200, 250000]" />
        </UFormGroup>
        <UFormGroup label="Flow Control">
          <USelect v-model="model.flowControl" :options="['none', 'hardware']" />
        </UFormGroup>

        <UFormGroup label="Data Bits">
          <USelect v-model="model.dataBits" :options="[7, 8]" />
        </UFormGroup>
        <UFormGroup label="Stop Bits">
          <USelect v-model="model.stopBits" :options="[1, 2]" />
        </UFormGroup>

        <UFormGroup label="Parity">
          <USelect v-model="model.parity" :options="['none', 'even', 'odd']" />
        </UFormGroup>
        <UFormGroup label="Buffer Size">
          <UInput v-model.number="model.bufferSize" type="number" />
        </UFormGroup>
      </div>

      <UDivider class="my-6" />

      <div class="grid gap-6 md:grid-cols-2">
        <UFormGroup label="Auto scroll">
          <USwitch v-model="prefs.autoScroll" />
        </UFormGroup>
        <UFormGroup label="Show timestamps">
          <USwitch v-model="prefs.timestamps" />
        </UFormGroup>
        <UFormGroup label="Send on Enter">
          <USwitch v-model="prefs.sendOnEnter" />
        </UFormGroup>
        <UFormGroup label="Hex view">
          <USwitch v-model="prefs.hexView" />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="ghost" @click="open = false">Close</UButton>
          <UButton color="primary" @click="apply">Apply</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Settings } from '@/composables/useUsb'

const props = defineProps<{
  modelValue: boolean
  settings: Settings
  uiPrefs?: {
    autoScroll: boolean
    timestamps: boolean
    sendOnEnter: boolean
    hexView: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:settings', v: Settings): void
  (e: 'update:uiPrefs', v: any): void
  (e: 'apply', payload: { settings: Settings, uiPrefs: any }): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const model = reactive<Settings>({ ...props.settings })
const prefs = reactive({
  autoScroll: props.uiPrefs?.autoScroll ?? true,
  timestamps: props.uiPrefs?.timestamps ?? false,
  sendOnEnter: props.uiPrefs?.sendOnEnter ?? true,
  hexView: props.uiPrefs?.hexView ?? false
})

watch(() => props.settings, v => Object.assign(model, v), { deep: true })

function apply() {
  emit('update:settings', { ...model })
  emit('update:uiPrefs', { ...prefs })
  emit('apply', { settings: { ...model }, uiPrefs: { ...prefs } })
  open.value = false
}
</script>
