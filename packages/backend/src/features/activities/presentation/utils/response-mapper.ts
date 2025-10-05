import type {
  ActivityDetail,
  ActivityListItem,
  ActivityListResult,
  ActivityNotificationSummary,
  ActivitySourceSummary,
  DataSourceActivitiesListResult,
} from "../../domain"

const formatDate = (value: Date | string): string =>
  new Date(value).toISOString()

const mapNotification = (notification: ActivityNotificationSummary) => ({
  hasUnread: notification.hasUnread,
  latestSentAt: notification.latestSentAt
    ? formatDate(notification.latestSentAt)
    : null,
})

const mapSource = (source: ActivitySourceSummary) => {
  const metadata = source.metadata
    ? {
        ...(source.metadata.repositoryFullName !== undefined
          ? { repositoryFullName: source.metadata.repositoryFullName }
          : {}),
        ...(source.metadata.repositoryLanguage !== undefined
          ? { repositoryLanguage: source.metadata.repositoryLanguage }
          : {}),
        ...(source.metadata.starsCount !== undefined
          ? { starsCount: source.metadata.starsCount }
          : {}),
        ...(source.metadata.forksCount !== undefined
          ? { forksCount: source.metadata.forksCount }
          : {}),
        ...(source.metadata.openIssuesCount !== undefined
          ? { openIssuesCount: source.metadata.openIssuesCount }
          : {}),
      }
    : undefined

  return {
    id: source.id,
    sourceType: source.sourceType,
    name: source.name,
    url: source.url,
    ...(metadata ? { metadata } : {}),
  }
}

const mapActivityItem = (item: ActivityListItem) => ({
  activity: {
    id: item.activity.id,
    activityType: item.activity.activityType,
    title: item.activity.title,
    summary: item.activity.summary,
    detail: item.activity.detail ?? null,
    status: item.activity.status,
    statusDetail: item.activity.statusDetail,
    version: item.activity.version,
    occurredAt: formatDate(item.activity.occurredAt),
    lastUpdatedAt: formatDate(item.activity.lastUpdatedAt),
    source: mapSource(item.activity.source),
  },
  notification: mapNotification(item.notification),
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
      summary: detail.activity.summary,
      detail: detail.activity.detail,
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
