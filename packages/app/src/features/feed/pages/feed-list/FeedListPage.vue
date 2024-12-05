<script setup lang="ts">
import type { A3MenuItemData } from "~/components/common/a3-menu-item"
import A3Button from "~/components/common/A3Button.vue"
import A3DropDown from "~/components/common/A3DropDown.vue"
import A3TextField from "~/components/common/A3TextField.vue"
import FeedListTable from "./parts/FeedListTable.vue"

const router = useRouter()

const { data: feeds } = useFetch("/api/feeds")

const filterMenuList: A3MenuItemData[] = [
  {
    label: "フィード名",
    value: "name",
  },
  {
    label: "登録日時",
    value: "createdAt",
  },
]

function handleAddFeedClick() {
  router.push({ path: "/feeds/new" })
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
        <A3TextField class="w-full" />
        <A3DropDown
          icon="material-symbols:filter-alt"
          :menus="filterMenuList"
          placeholder="ソート条件"
          :value="undefined"
        />
      </div>
      <div class="flex flex-col items-center gap-4">
        <FeedListTable v-if="feeds?.result" :feeds="feeds?.result" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
