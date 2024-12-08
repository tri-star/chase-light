<script setup lang="ts">
import type { A3MenuItemData } from "~/components/common/a3-menu-item"
import A3Button from "~/components/common/A3Button.vue"
import A3DropDown from "~/components/common/A3DropDown.vue"
import A3TextField from "~/components/common/A3TextField.vue"
import FeedListTable from "./parts/FeedListTable.vue"
import type { ApiQueryParametersByPath } from "~/lib/api/client"
import { makeEnumFromArray } from "core/utils/zod-utils"
import { SORT_ITEMS_VALUES } from "core/features/feed/feed"
import { SORT_DIRECTION_VALUES } from "core/constants"

const router = useRouter()

const filterMenuList: A3MenuItemData[] = [
  {
    label: "更新日：降順",
    value: "updatedAt:desc",
  },
  {
    label: "更新日：昇順",
    value: "updatedAt:asc",
  },
  {
    label: "登録日：降順",
    value: "createdAt:desc",
  },
  {
    label: "登録日：昇順",
    value: "createdAt:asc",
  },
]

const keyword = ref("")
const sort = ref("createdAt:asc")

const searchQuery = ref<ApiQueryParametersByPath<"get", "/feeds">>({})

const { data: feeds, status } = useFetch("/api/feeds", {
  query: searchQuery,
})

const isListLoading = computed(() => status.value === "pending")
const loadingClass = computed(() =>
  isListLoading.value ? "animate-pulse" : ""
)

function handleAddFeedClick() {
  router.push({ path: "/feeds/new" })
}

function handlesortChange(value: string) {
  sort.value = value
  handleReloadList()
}

async function handleReloadList() {
  const [sortItem, direction] = sort.value.split(":")
  searchQuery.value = {
    keyword: keyword.value === "" ? undefined : keyword.value,
    sort: makeEnumFromArray(SORT_ITEMS_VALUES).parse(sortItem),
    sortDirection: makeEnumFromArray(SORT_DIRECTION_VALUES).parse(direction),
  }
}
</script>

<template>
  <div
    class="bg-default flex flex-col rounded-2xl p-4 md:w-[800px] lg:w-[1000px]"
  >
    <div class="flex flex-col gap-6">
      <div class="flex items-center">
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
          @input="(e) => (keyword = e.target.value)"
          @keyup.enter="handleReloadList"
        />
        <A3DropDown
          icon="material-symbols:filter-alt"
          :menus="filterMenuList"
          placeholder="ソート条件"
          :value="sort"
          @change="handlesortChange"
        />
      </div>
      <div class="flex flex-col items-center gap-4" :class="loadingClass">
        <FeedListTable v-if="feeds?.result" :feeds="feeds?.result" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
