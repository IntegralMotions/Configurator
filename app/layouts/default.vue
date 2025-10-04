<!-- /layouts/default.vue -->
<template>
    <UHeader>
        <template #left>
            <NuxtLink to="/" class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-800/50">
                <UIcon name="i-ph-house-bold" class="w-5 h-5" />
                <span class="sr-only">Home</span>
            </NuxtLink>
        </template>
        <template #right>
            <UColorModeSelect />
        </template>
    </UHeader>
    <UMain class="flex p-6">
        <slot />
    </UMain>
</template>

<script lang="ts" setup>
const route = useRoute()
const pageTitle = computed(() => route.meta?.title ?? 'Integral Motions')
useHead(() => ({ title: pageTitle.value }))
</script>
