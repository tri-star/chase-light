<script setup lang="ts">
import type { A3MenuItemData } from '~/components/common/a3-menu-item'
import A3Button from '~/components/common/A3Button.vue'
import A3DropDown from '~/components/common/A3DropDown.vue'
import A3TextField from '~/components/common/A3TextField.vue'
import type { ApiQueryParametersByAlias } from '~/lib/api/client'
import { feedSearchFormSchema } from '~/features/feed/domain/feed'
import FeedListTable from './parts/FeedListTable.vue'
import FeedListEmpty from './parts/FeedListEmpty.vue'

const props = defineProps<{
  keyword?: string
  sort?: string
}>()

const router = useRouter()

const filterMenuList: A3MenuItemData[] = [
  {
    label: '更新日：降順',
    value: 'updatedAt:desc',
  },
  {
    label: '更新日：昇順',
    value: 'updatedAt:asc',
  },
  {
    label: '登録日：降順',
    value: 'createdAt:desc',
  },
  {
    label: '登録日：昇順',
    value: 'createdAt:asc',
  },
]

const searchQuery = computed<ApiQueryParametersByAlias<'getFeeds'>>(() => {
  const [sortItem, direction] = searchForm.value.sort.split(':')
  return feedSearchFormSchema.parse({
    keyword: props.keyword ? props.keyword : undefined,
    sort: sortItem,
    sortDirection: direction,
  })
})

const searchForm = ref({
  keyword: props.keyword,
  sort: props.sort ? props.sort : 'updatedAt:desc',
})

const { data: feeds, status } = useA3Fetch('/api/feeds', {
  query: searchQuery,
})

const isListLoading = computed(() => status.value === 'pending')
const loadingClass = computed(() =>
  isListLoading.value ? 'animate-pulse' : ''
)

function handleAddFeedClick() {
  router.push({ path: '/feeds/new' })
}

function handlesortChange(value: string) {
  searchForm.value.sort = value
  handleReloadList()
}

async function handleReloadList() {
  router.push({ query: searchForm.value })
}
</script>

<template>
  <div
    class="bg-default flex w-full flex-col rounded-2xl p-4 md:w-[800px] lg:w-[1000px]"
  >
    <div class="flex flex-col gap-6">
      <div class="flex flex-col items-center gap-4 md:flex-row">
        <h1 class="flex-1">フィード一覧</h1>
        <A3Button
          label="フィード登録"
          type="primary"
          @click="handleAddFeedClick"
        />
      </div>
      <div class="flex items-center gap-4">
        <A3TextField
          class="w-full"
          :value="keyword"
          @input="(e) => (searchForm.keyword = e.target.value)"
          @keyup.enter="handleReloadList"
        />
        <A3DropDown
          icon="material-symbols:filter-alt"
          :menus="filterMenuList"
          placeholder="ソート条件"
          :value="searchForm.sort"
          @change="handlesortChange"
        />
      </div>
      <div
        v-if="(feeds?.result.length ?? 0) > 0"
        class="flex flex-col items-center gap-4"
        :class="loadingClass"
      >
        <FeedListTable v-if="feeds?.result" :feeds="feeds?.result" />
      </div>
      <div v-else class="flex justify-center">
        <FeedListEmpty />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
