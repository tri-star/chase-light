import type {
  ActivityDetail,
  ActivityListItem,
  ActivityListResult,
  ActivitySourceSummary,
  DataSourceActivitiesListResult,
} from "../../domain"

const formatDate = (value: Date | string): string =>
  new Date(value).toISOString()

const mapSource = (source: ActivitySourceSummary) => {
  const metadata = source.metadata
    ? (Object.fromEntries(
        Object.entries(source.metadata).filter(
          ([, value]) => value !== undefined,
        ),
      ) as ActivitySourceSummary["metadata"])
    : undefined

  const hasMetadata = metadata && Object.keys(metadata).length > 0

  return {
    id: source.id,
    sourceType: source.sourceType,
    name: source.name,
    url: source.url,
    ...(hasMetadata ? { metadata } : {}),
  }
}

const mapActivityItem = (item: ActivityListItem) => ({
  activity: {
    id: item.activity.id,
    activityType: item.activity.activityType,
    title: item.activity.title,
    translatedTitle: item.activity.translatedTitle,
    summary: item.activity.summary,
    detail: item.activity.detail ?? null,
    translatedBody: item.activity.translatedBody,
    bodyTranslationStatus: item.activity.bodyTranslationStatus,
    status: item.activity.status,
    statusDetail: item.activity.statusDetail,
    version: item.activity.version,
    occurredAt: formatDate(item.activity.occurredAt),
    lastUpdatedAt: formatDate(item.activity.lastUpdatedAt),
    source: mapSource(item.activity.source),
  },
})

export const mapListResultToResponse = (result: ActivityListResult) => ({
  success: true as const,
  data: {
    items: result.items.map(mapActivityItem),
    pagination: {
      page: result.pagination.page,
      perPage: result.pagination.perPage,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    },
  },
})

export const mapActivityDetailToResponse = (detail: ActivityDetail) => ({
  success: true as const,
  data: {
    activity: {
      id: detail.activity.id,
      activityType: detail.activity.activityType,
      title: detail.activity.title,
      translatedTitle: detail.activity.translatedTitle,
      summary: detail.activity.summary,
      detail: detail.activity.detail,
      translatedBody: detail.activity.translatedBody,
      bodyTranslationStatus: detail.activity.bodyTranslationStatus,
      status: detail.activity.status,
      statusDetail: detail.activity.statusDetail,
      version: detail.activity.version,
      occurredAt: formatDate(detail.activity.occurredAt),
      lastUpdatedAt: formatDate(detail.activity.lastUpdatedAt),
      source: mapSource(detail.activity.source),
    },
  },
})

export const mapDataSourceActivitiesResultToResponse = (
  result: DataSourceActivitiesListResult,
) => ({
  success: true as const,
  data: {
    dataSource: mapSource(result.dataSource),
    items: result.items.map(mapActivityItem),
    pagination: {
      page: result.pagination.page,
      perPage: result.pagination.perPage,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    },
  },
})
