<template>
  <UnsupportedBrowser>
    <UContainer class="py-5 space-y-6">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="ph:sliders-horizontal" size="22" />
          <h1 class="text-xl font-semibold">Integral Motion — Configurator </h1>
        </div>
        <div class="flex items-center gap-2">
          <UButton :loading="busy" @click="connect">{{ sessionActive ? 'Disconnect' : 'Connect' }}</UButton>
        </div>
      </header>

      <UAlert v-if="writeError && !reconnecting" color="error" icon="i-heroicons-exclamation-triangle"
        title="Operation failed"
        :description="writeError" />

      <UAlert v-if="failedCount > 0 && !writeError" color="warning" icon="i-heroicons-exclamation-triangle"
        :title="`${failedCount} ${failedCount === 1 ? 'setting failed' : 'settings failed'} to write`"
        description="Fix the highlighted values and write again." />

      <div v-if="sessionActive" class="relative">
        <div class="space-y-6 transition duration-200"
          :class="reconnecting ? 'pointer-events-none select-none blur-sm opacity-50' : ''">
          <UCard>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm opacity-80">
                <span class="font-medium">{{ payload.deviceInfo.model ?? 'Unknown device' }}</span>
                <span class="mx-2">•</span>
                FW {{ payload.deviceInfo.firmwareVersion ?? 'Unknown' }}
              </div>
              <div class="flex items-center gap-3">
                <UBadge :color="reconnecting ? 'warning' : isDirty ? 'primary' : 'secondary'" variant="subtle">
                  {{ reconnecting ? 'Reconnecting' : isDirty ? 'Unsaved changes' : 'Synced' }}
                </UBadge>
                <UButton variant="soft" :disabled="!connected || writing" @click="readAll">Read</UButton>
                <UButton :loading="writing" :disabled="!connected || !isDirty || writing" @click="writeAll">
                  Write
                </UButton>
              </div>
            </div>
          </UCard>

          <UTabs :items="payload.modules" label-key="id" class="gap-5">
            <template #content="{ item }">
              <div class="grid gap-5 md:grid-cols-2">
                <UCard v-for="g in item.groups" :key="g.id">
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h2 class="text-base font-semibold">{{ g.id }}</h2>
                      <UButton size="xs" variant="ghost" @click="resetGroup(item.id, g.id)"
                        :disabled="!groupDirty(item.id, g.id)">
                        Reset
                      </UButton>
                    </div>
                  </template>

                  <div class="divide-y divide-gray-200/60 dark:divide-gray-800">
                    <SettingField v-for="s in g.settings" :key="s.value.id" :setting="s"
                      :model-value="values[settingKey(item.id, g.id, s.value.id)]"
                      :error="fieldErrors[settingKey(item.id, g.id, s.value.id)]"
                      :dirty="isSettingDirty(item.id, g.id, s.value.id)"
                      @update:model-value="setValue(item.id, g.id, s.value.id, $event)" />
                  </div>
                </UCard>
              </div>
            </template>
          </UTabs>
        </div>

        <div v-if="reconnecting" class="absolute inset-0 z-10 flex items-start justify-center pt-24">
          <UCard class="w-full max-w-md text-center shadow-xl">
            <div class="space-y-4">
              <UIcon name="i-lucide-loader-circle" class="mx-auto size-9 animate-spin text-primary" />
              <div>
                <h2 class="text-lg font-semibold">Device disconnected</h2>
                <p class="mt-1 text-sm text-muted">Waiting for the serial port to reconnect…</p>
              </div>
              <UButton color="error" variant="soft" @click="connect">Disconnect</UButton>
            </div>
          </UCard>
        </div>
      </div>

      <UAlert v-else icon="i-heroicons-information-circle" title="Not connected"
        description="Select your serial port and connect to load settings." />
    </UContainer>
  </UnsupportedBrowser>
</template>

<script setup lang="ts">
const { connected, reconnecting, sessionActive, busy, writing, writeError, payload, values,
  isDirty, isSettingDirty, groupDirty, settingKey, fieldErrors, failedCount, setValue,
  connect, readAll, writeAll, resetGroup } = useConfigurator()
</script>
