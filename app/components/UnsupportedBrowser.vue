<!-- components/UnsupportedBrowser.vue -->
<template>
    <ClientOnly>

        <div v-if="!isSupported" class="w-full grid place-items-center p-6">
            <UCard class="max-w-md w-full text-center space-y-4">
                <template #header>
                    <div class="flex items-center justify-center gap-2">
                        <UIcon name="i-heroicons-no-symbol" class="size-6 text-red-500" />
                        <span class="font-semibold text-lg">Unsupported Browser</span>
                    </div>
                </template>

                <p>Your browser does not support WebUSB or Web Serial.</p>
                <p class="text-sm text-gray-500">
                    Please use a Chromium-based browser (e.g. Chrome, Edge) over
                    <code>https://</code>.
                </p>

                <template #footer>
                    <UButton to="https://www.google.com/chrome/" target="_blank" color="primary"
                        icon="i-heroicons-arrow-down-tray">
                        Get Chrome
                    </UButton>
                </template>
            </UCard>
        </div>
        <template v-else>
            <slot />
        </template>
    </ClientOnly>
</template>

<script setup lang="ts">
const { isSupported } = useUsb()
</script>
