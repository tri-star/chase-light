import { computed } from 'vue'
import { DataSourceDetailRepository } from '~/features/data-sources/repositories/data-source-detail-repository'
import { DataSourceActivitiesRepository } from '~/features/data-sources/repositories/data-source-activities-repository'
import type {
  DataSourceDetail,
  DataSourceActivityListResponseData,
} from '~/features/data-sources/domain/data-source-detail'

export function useDataSourceDetail(dataSourceId: string) {
  const dataSourceDetailRepository = new DataSourceDetailRepository()
  const dataSourceActivitiesRepository = new DataSourceActivitiesRepository()

  // データソース詳細の取得
  const detailFetchKey = computed(() => `data-source-detail:${dataSourceId}`)
  const {
    data: detailData,
    error: detailError,
    pending: detailPending,
  } = useAsyncData<DataSourceDetail>(
    detailFetchKey.value,
    () => dataSourceDetailRepository.fetch(dataSourceId),
    {
      server: true,
      lazy: false,
    }
  )

  // アクティビティ一覧の取得（上位20件、更新日時降順）
  const activitiesFetchKey = computed(
    () => `data-source-activities:${dataSourceId}`
  )
  const {
    data: activitiesData,
    error: activitiesError,
    pending: activitiesPending,
  } = useAsyncData<DataSourceActivityListResponseData>(
    activitiesFetchKey.value,
    () =>
      dataSourceActivitiesRepository.fetch(dataSourceId, {
        perPage: 20,
        sort: 'createdAt',
        order: 'desc',
      }),
    {
      server: true,
      lazy: true, // データソース詳細を優先して取得
    }
  )

  const dataSource = computed(() => detailData.value?.dataSource)
  const userWatch = computed(() => detailData.value?.userWatch)
  const activities = computed(() => activitiesData.value?.items ?? [])
  const pagination = computed(() => activitiesData.value?.pagination)

  const error = computed(() => detailError.value || activitiesError.value)
  const pending = computed(() => detailPending.value)
  const activitiesLoading = computed(() => activitiesPending.value)

  const pageTitle = computed(() => dataSource.value?.name || 'データソース詳細')

  return {
    dataSource,
    userWatch,
    activities,
    pagination,
    error,
    pending,
    activitiesLoading,
    pageTitle,
  }
}
