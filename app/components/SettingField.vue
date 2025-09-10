<script setup lang="ts">
type Bool = { id: string; label: string; type: 'bool'; value: boolean; unit?: string; readonly?: boolean }
type Num = { id: string; label: string; type: 'int' | 'float' | 'range'; value: number; min?: number; max?: number; step?: number; unit?: string; readonly?: boolean }
type Str = { id: string; label: string; type: 'string'; value: string; unit?: string; readonly?: boolean }
type Enm = { id: string; label: string; type: 'enum'; value: string | number; options: (string | number)[]; unit?: string; readonly?: boolean }
type Setting = Bool | Num | Str | Enm

const props = defineProps<{ setting: Setting; modelValue: any; dirty?: boolean }>()
const emit = defineEmits(['update:modelValue'])

function inputFor(s: Setting) {
    if (s.type === 'bool') return resolveComponent('USwitch')
    if (s.type === 'enum') return resolveComponent('USelect')
    if (s.type === 'range') return resolveComponent('USlider')
    return resolveComponent('UInput')
}
function inputProps(s: Setting) {
    if (s.type === 'bool') return { size: 'md', disabled: s.readonly }
    if (s.type === 'enum') return { size: 'md', options: (s as Enm).options, disabled: s.readonly }
    const p: any = { size: 'md', type: s.type === 'string' ? 'text' : 'number', step: (s as any).step ?? 1, disabled: s.readonly }
    if ('min' in s && s.min !== undefined) p.min = s.min
    if ('max' in s && s.max !== undefined) p.max = s.max
    return p
}
</script>

<template>
    <div class="py-2">
        <div class="flex items-center justify-between gap-3 mb-1">
            <div class="text-sm font-medium">{{ setting.label }}</div>
            <UBadge v-if="dirty" color="primary" variant="subtle">modified</UBadge>
        </div>
        <div class="flex items-center gap-3">
            <component :is="inputFor(setting)" :model-value="modelValue" v-bind="inputProps(setting)"
                @update:model-value="v => emit('update:modelValue', v)" class="flex-1" />
            <span v-if="setting.unit" class="text-xs opacity-60 w-16 text-right">{{ setting.unit }}</span>
        </div>
    </div>
</template>
