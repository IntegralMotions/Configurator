<!-- /layouts/default.vue -->
<template>
    <main class="min-h-screen max-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div class="min-h-screen max-h-screen flex flex-col">
            <header class="sticky top-0 z-50 border-b border-gray-800/50 bg-background/80 backdrop-blur">
                <UContainer class="py-3">
                    <div class="flex items-center gap-4">
                        <NuxtLink to="/"
                            class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-800/50">
                            <UIcon name="i-ph-house-bold" class="w-5 h-5" />
                            <span class="sr-only">Home</span>
                        </NuxtLink>

                        <h1 class="text-lg font-semibold truncate">{{ pageTitle }}</h1>

                        <div class="ml-auto flex items-center gap-2">
                            <div id="header-right" class="flex items-center" />
                            <ColorModeDropdown class="ml-6" />
                        </div>
                    </div>
                </UContainer>
            </header>

            <div class="p-6 flex-1 min-h-0 flex">
                <slot />
            </div>
        </div>
    </main>
</template>

<script lang="ts" setup>
const route = useRoute()
const pageTitle = computed(() => route.meta?.title ?? 'Integral Motions')
useHead(() => ({ title: pageTitle.value }))
</script>
