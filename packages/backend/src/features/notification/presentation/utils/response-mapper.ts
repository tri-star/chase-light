import type { NotificationListItem } from "../../domain/notification-query"
import type { ListNotificationsOutput } from "../../application/use-cases/list-notifications.use-case"

const formatDate = (value: Date | string): string =>
  new Date(value).toISOString()

const formatNullableDate = (
  value: Date | string | null | undefined,
): string | null => {
  if (!value) {
    return null
  }
  return formatDate(value)
}

const mapDigestEntry = (
  entry: NotificationListItem["dataSources"][number]["groups"][number]["entries"][number],
) => ({
  activityId: entry.activityId,
  title: entry.title,
  summary: entry.summary,
  occurredAt: formatDate(entry.occurredAt),
  url: entry.url ?? null,
  displayOrder: entry.displayOrder,
})

const mapDigestGroup = (
  group: NotificationListItem["dataSources"][number]["groups"][number],
) => ({
  activityType: group.activityType,
  entries: [...group.entries]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(mapDigestEntry),
})

const mapDataSource = (
  dataSource: NotificationListItem["dataSources"][number],
) => ({
  id: dataSource.id,
  name: dataSource.name,
  url: dataSource.url,
  sourceType: dataSource.sourceType,
  ...(dataSource.repository?.fullName
    ? { repository: { fullName: dataSource.repository.fullName } }
    : {}),
  groups: dataSource.groups.map(mapDigestGroup),
})

const mapNotificationSummary = (item: NotificationListItem) => ({
  id: item.notification.id,
  type: item.notification.type,
  status: item.notification.status,
  isRead: item.notification.isRead,
  scheduledAt: formatDate(item.notification.scheduledAt),
  sentAt: formatNullableDate(item.notification.sentAt),
  createdAt: formatDate(item.notification.createdAt),
  updatedAt: formatDate(item.notification.updatedAt),
  lastActivityOccurredAt: formatDate(item.notification.lastActivityOccurredAt),
  metadata: item.notification.metadata ?? null,
})

export const mapNotificationListItem = (item: NotificationListItem) => ({
  notification: mapNotificationSummary(item),
  dataSources: item.dataSources.map(mapDataSource),
})

export const mapListResultToResponse = (result: ListNotificationsOutput) => ({
  success: true as const,
  data: {
    items: result.items.map(mapNotificationListItem),
    pageInfo: {
      hasNext: result.pageInfo.hasNext,
      ...(result.pageInfo.nextCursor
        ? { nextCursor: result.pageInfo.nextCursor }
        : {}),
    },
  },
})

export const mapNotificationDetailToResponse = (
  item: NotificationListItem,
) => ({
  success: true as const,
  data: {
    item: mapNotificationListItem(item),
  },
})
