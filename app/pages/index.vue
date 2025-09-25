<template>
  <UContainer class="flex items-center justify-center">
    <div class="grid gap-12 md:grid-cols-2 max-w-6xl w-full">
      <NuxtLink to="/serial" class="block">
        <UCard class="overflow-hidden flex flex-col h-full transition hover:shadow-lg">
          <div
            class="h-64 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700">
            <UIcon name="i-ph-serial-port" class="w-24 h-24 opacity-80" />
          </div>
          <div class="p-8 space-y-3">
            <h2 class="text-2xl font-semibold">Serial Monitor</h2>
            <p class="text-base opacity-80">Live stream, filtering, quick export.</p>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/configurator" class="block">
        <UCard class="overflow-hidden flex flex-col h-full transition hover:shadow-lg">
          <div
            class="h-64 flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-700 dark:to-indigo-900">
            <UIcon name="i-ph-sliders-bold" class="w-24 h-24 opacity-80 text-white" />
          </div>
          <div class="p-8 space-y-3">
            <h2 class="text-2xl font-semibold">Configurator</h2>
            <p class="text-base opacity-80">Tune parameters, save/load presets.</p>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>

<script lang="ts" setup></script>

<style></style>
