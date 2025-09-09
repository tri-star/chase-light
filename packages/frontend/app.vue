<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// テーマ管理の初期化
import { useTheme } from '@/composables/useTheme'

useTheme()
</script>
