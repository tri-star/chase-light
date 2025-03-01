<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import DashboardPage from '~/components/pages/dashboard/DashboardPage.vue'

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})
</script>

<template>
  <DashboardPage />
</template>
