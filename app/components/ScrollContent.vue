<template>
  <div class="flex flex-col w-full grow">
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
