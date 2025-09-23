<template>
  <div ref="scroller" class="min-h-0 w-full overflow-auto">
    <pre :class="wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'"
      class="font-mono text-sm leading-relaxed select-text">
{{ text }}
    </pre>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  wrap?: boolean
  autoScroll?: boolean
}>(), { wrap: true, autoScroll: true })

const scroller = ref<HTMLElement | null>(null)

watch(() => props.text, () => {
  if (!props.autoScroll || !scroller.value) return
  scroller.value.scrollTop = scroller.value.scrollHeight
})
</script>
