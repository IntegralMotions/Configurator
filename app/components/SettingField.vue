<script setup lang="ts">
const props = defineProps<{ setting: Setting; modelValue: SettingValue; dirty?: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: SettingValue] }>()

const value = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const definition = computed(() => props.setting.value)
const isNumeric = computed(() => props.setting.type !== 'bool')
const hasOptions = computed(() => definition.value.limits.options.length > 0)
const useSlider = computed(() => isNumeric.value
    && definition.value.limits.isRange
    && definition.value.limits.min !== undefined
    && definition.value.limits.max !== undefined)

</script>

<template>
    <div class="py-2">
        <div class="flex items-center justify-between gap-3 mb-1">
            <div class="text-sm font-medium">{{ definition.id }}</div>
            <UBadge v-if="dirty" color="primary" variant="subtle" size="sm">modified</UBadge>
        </div>
        <div class="flex items-center gap-3">
            <template v-if="hasOptions">
                <UInputMenu v-model="value" size="md" :items="definition.limits.options" label-key="id"
                    value-key="value" :disabled="definition.readonly" />
            </template>

            <template v-else-if="setting.type === 'bool'">
                <USwitch v-model="value" size="md" :disabled="definition.readonly" />
            </template>

            <template v-else-if="isNumeric && !useSlider">
                <UInputNumber v-model="value" size="md" :disabled="definition.readonly"
                    :min="definition.limits.min" :max="definition.limits.max" :step="definition.limits.step" />
            </template>

            <template v-else-if="useSlider">
                <USlider v-model="value" size="md" :disabled="definition.readonly"
                    :min="definition.limits.min" :max="definition.limits.max" :step="definition.limits.step" tooltip
                    class="my-2" />
            </template>

            <span v-if="definition.unit" class="text-xs opacity-60 text-right">{{ definition.unit }}</span>
        </div>
        <p v-if="error" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ error }}</p>
    </div>
</template>
