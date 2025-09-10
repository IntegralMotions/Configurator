<template>
  <UContainer class="py-6 space-y-6">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="ph:sliders-horizontal" size="22" />
        <h1 class="text-xl font-semibold">Integral Motion — Configurator </h1>
      </div>
      <div class="flex items-center gap-2">
        <USelect v-model="transport" :options="['WebUSB', 'WebSerial']" size="sm" />
        <UButton :loading="busy" @click="connect">{{ connected ? 'Disconnect' : 'Connect' }}</UButton>
      </div>
    </header>

    <UCard v-if="connected">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm opacity-80">
          <span class="font-medium">{{ payload.deviceInfo?.model }}</span>
          <span class="mx-2">•</span>
          FW {{ payload.deviceInfo?.fw }}
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="isDirty ? 'primary' : 'secondary'" variant="subtle">
            {{ isDirty ? 'Unsaved changes' : 'Synced' }}
          </UBadge>
          <UButton variant="soft" @click="readAll">Read</UButton>
          <UButton :disabled="!isDirty" @click="writeAll">Write</UButton>
        </div>
      </div>
    </UCard>

    <div v-if="connected" class="grid gap-5 md:grid-cols-2">
      <UCard v-for="g in payload.groups" :key="g.id">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold">{{ g.label }}</h2>
            <UButton size="xs" variant="ghost" @click="resetGroup(g.id)" :disabled="!groupDirty(g.id)">Reset</UButton>
          </div>
        </template>

        <div class="divide-y divide-gray-200/60 dark:divide-gray-800">
          <SettingField v-for="s in g.settings" :key="s.id" :setting="s" v-model="values[s.id]"
            :dirty="isSettingDirty(s.id)" />
        </div>
      </UCard>
    </div>

    <UAlert v-else icon="i-heroicons-information-circle" title="Not connected"
      description="Choose a transport and connect to load settings." />
  </UContainer>
</template>

<script setup lang="ts">
const { transport, connected, busy, payload, values,
  isDirty, isSettingDirty, groupDirty,
  connect, readAll, writeAll, resetGroup } = useConfigurator()
</script>