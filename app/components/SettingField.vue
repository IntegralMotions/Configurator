<script setup lang="ts">
const props = defineProps<{ setting: Setting; modelValue: any; dirty?: boolean }>()
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

</script>

<template>
    <div class="py-2">
        <div class="flex items-center justify-between gap-3 mb-1">
            <div class="text-sm font-medium">{{ setting.label }}</div>
            <UBadge v-if="dirty" color="primary" variant="subtle" size="sm">modified</UBadge>
        </div>
        <div class="flex items-center gap-3">
            <template v-if="setting.type === 'bool'">
                <USwitch v-model="value" size="md" :disabled="setting.readonly" />
            </template>

            <template v-if="setting.type === 'string'">
                <UInput v-model="value" size="md" :disabled="setting.readonly" />
            </template>

            <template v-if="setting.type === 'options'">
                <UInputMenu v-model="value" size="md" :items="setting.options" :disabled="setting.readonly" />
            </template>

            <template v-if="setting.type === 'int' || setting.type === 'float'">
                <UInputNumber v-model="value" size="md" :disabled="setting.readonly" :min="setting.min"
                    :max="setting.max" :step="setting.step" />
            </template>

            <template v-if="setting.type === 'range'">
                <USlider v-model="value" size="md" :disabled="setting.readonly" :min="setting.min" :max="setting.max"
                    :step="setting.step" tooltip class="my-2" />
            </template>

            <span v-if="setting.unit" class="text-xs opacity-60 text-right">{{ setting.unit }}</span>
        </div>
    </div>
</template>
