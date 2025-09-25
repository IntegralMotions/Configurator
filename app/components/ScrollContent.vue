<template>
  <div class="flex w-full grow" :class="horizontal ? 'flex-row' : 'flex-col'">
    <div v-if="$slots.header" class="flex-shrink-0">
      <slot name="header" />
    </div>

    <div class="flex-1 min-h-0 overflow-auto flex">
      <slot />
    </div>

    <div v-if="$slots.footer" class="flex-shrink-0">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ horizontal?: boolean }>()
</script>
