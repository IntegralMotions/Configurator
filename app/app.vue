<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/next';

</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <main class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <NuxtPage />
    </main>
  </UApp>
  <SpeedInsights />
</template>
