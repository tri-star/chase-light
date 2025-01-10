<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import FeedCreatePage from '~/features/feed/pages/feed-form/FeedCreatePage.vue'

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})
</script>

<template>
  <FeedCreatePage />
</template>
