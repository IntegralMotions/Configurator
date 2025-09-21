<template>
  <Teleport to="#header-right">
    <div v-if="usb.isSupported.value" class="flex items-center gap-3">
      <USelect v-model="usb.protocol.value" :items="usb.protocolOptions.value" class="w-24" />
      <UButton :disabled="!canConnect" @click="usb.request()">Request Device</UButton>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const usb = useUsb()
const canConnect = computed(() => usb.isSupported.value && usb.protocolOptions.value.length > 0)
</script>
