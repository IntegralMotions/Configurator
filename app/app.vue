<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/nuxt';

</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
  <SpeedInsights />
</template>
