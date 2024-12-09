<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"
import FeedListPage from "~/features/feed/pages/feed-list/FeedListPage.vue"

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})

const route = useRoute()

const keyword = ref(route.query.keyword as string | undefined)
const sort = ref(route.query.sort as string | undefined)

watch(
  () => route.query,
  (newQuery) => {
    keyword.value = newQuery.keyword as string | undefined
    sort.value = newQuery.sort as string | undefined
  }
)
</script>

<template>
  <FeedListPage :keyword="keyword" :sort="sort" />
</template>
