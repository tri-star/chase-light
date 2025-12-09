<script setup lang="ts">
import ClSection from '~/components/base/ClSection.vue'
import DataSourceDetailHeader from './parts/DataSourceDetailHeader.vue'
import DataSourceDetailInfo from './parts/DataSourceDetailInfo.vue'
import DataSourceActivityList from './parts/DataSourceActivityList.vue'
import DataSourceDetailError from './parts/DataSourceDetailError.vue'
import { useDataSourceDetail } from './use-data-source-detail'

const props = defineProps<{
  dataSourceId: string
}>()

const {
  dataSource,
  userWatch,
  activities,
  pagination,
  error,
  pending,
  activitiesLoading,
  pageTitle,
} = await useDataSourceDetail(props.dataSourceId)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
})
</script>

<template>
  <DataSourceDetailError v-if="error" :error="error" />
  <div v-else-if="pending" class="flex items-center justify-center py-12">
    <div class="text-card-value">読み込み中...</div>
  </div>
  <ClSection v-else class="space-y-6" data-testid="data-source-detail-page">
    <template v-if="dataSource">
      <DataSourceDetailHeader :data-source="dataSource" />
      <DataSourceDetailInfo :data-source="dataSource" :user-watch="userWatch" />
      <DataSourceActivityList
        :activities="activities"
        :pagination="pagination"
        :loading="activitiesLoading"
      />
    </template>
  </ClSection>
</template>
