<template>
  <UDropdownMenu :items="items">
    <UButton :label="colorModeDisplay.label" :icon="colorModeDisplay.icon" color="neutral" variant="outline" />
  </UDropdownMenu>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const colorModeDisplay = computed(() => {
  switch (colorMode.preference) {
    case 'system':
      return { icon: 'i-ph-monitor', label: 'System' }
    case 'light':
      return { icon: 'i-ph-sun', label: 'Light' }
    case 'dark':
      return { icon: 'i-ph-moon', label: 'Dark' }
    default:
      return { icon: 'i-ph-monitor', label: 'System' }
  }
})

const items = ref([
  {
    label: 'System',
    icon: 'i-ph-monitor',
    onSelect: () => {
      colorMode.preference = 'system'
    }
  },
  {
    label: 'Light',
    icon: 'i-ph-sun',
    onSelect: () => {
      colorMode.preference = 'light'
    }
  },
  {
    label: 'Dark',
    icon: 'i-ph-moon',
    onSelect: () => {
      colorMode.preference = 'dark'
    }
  }
])
</script>
