import type {
  NotificationDigestGroup,
  NotificationDigestGroupActivityType,
  NotificationDigestEntry,
  NotificationListItem,
  NotificationListResponseData,
} from '~/generated/api/schemas'

export const NOTIFICATION_GROUP_ENTRY_LIMIT = 5

const ACTIVITY_LABEL_MAP: Record<NotificationDigestGroupActivityType, string> =
  {
    issue: 'Issue',
    pull_request: 'Pull Request',
    release: 'リリース',
  }

const formatIsoToYmdHm = (iso: string | null): string => {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number): string => value.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())

  return `${year}/${month}/${day} ${hour}:${minute}`
}

const sortEntriesByDisplayOrder = (
  entries: NotificationDigestEntry[]
): NotificationDigestEntry[] => {
  return [...entries].sort((a, b) => a.displayOrder - b.displayOrder)
}

export interface NotificationDigestEntryViewModel {
  id: string
  title: string
  summary: string
  occurredAt: string
  occurredAtLabel: string
  url: string | null
}

export interface NotificationDigestGroupViewModel {
  activityType: NotificationDigestGroupActivityType
  activityLabel: string
  entries: NotificationDigestEntryViewModel[]
}

export interface NotificationDataSourceViewModel {
  id: string
  name: string
  url: string
  sourceType: string
  repositoryFullName?: string
  groups: NotificationDigestGroupViewModel[]
}

export interface NotificationListItemViewModel {
  id: string
  type: string
  status: string
  isRead: boolean
  scheduledAt: string
  sentAt: string | null
  displayTimestamp: string
  displayTimestampLabel: string
  lastActivityOccurredAt: string
  lastActivityOccurredAtLabel: string
  dataSources: NotificationDataSourceViewModel[]
}

const mapDigestEntries = (
  entries: NotificationDigestEntry[]
): NotificationDigestEntryViewModel[] => {
  return sortEntriesByDisplayOrder(entries)
    .slice(0, NOTIFICATION_GROUP_ENTRY_LIMIT)
    .map((entry) => ({
      id: entry.activityId,
      title: entry.title,
      summary: entry.summary,
      occurredAt: entry.occurredAt,
      occurredAtLabel: formatIsoToYmdHm(entry.occurredAt),
      url: entry.url,
    }))
}

const mapDigestGroups = (
  groups: NotificationDigestGroup[]
): NotificationDigestGroupViewModel[] => {
  return groups.map((group) => ({
    activityType: group.activityType,
    activityLabel: ACTIVITY_LABEL_MAP[group.activityType] ?? group.activityType,
    entries: mapDigestEntries(group.entries),
  }))
}

const mapDataSources = (
  sources: NotificationListItem['dataSources']
): NotificationDataSourceViewModel[] => {
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    url: source.url,
    sourceType: source.sourceType,
    repositoryFullName: source.repository?.fullName,
    groups: mapDigestGroups(source.groups),
  }))
}

export const mapNotificationItems = (
  items: NotificationListResponseData['items']
): NotificationListItemViewModel[] => {
  return items.map((item) => {
    const displayTimestamp =
      item.notification.sentAt ?? item.notification.scheduledAt

    return {
      id: item.notification.id,
      type: item.notification.type,
      status: item.notification.status,
      isRead: item.notification.isRead,
      scheduledAt: item.notification.scheduledAt,
      sentAt: item.notification.sentAt,
      displayTimestamp,
      displayTimestampLabel: formatIsoToYmdHm(displayTimestamp),
      lastActivityOccurredAt: item.notification.lastActivityOccurredAt,
      lastActivityOccurredAtLabel: formatIsoToYmdHm(
        item.notification.lastActivityOccurredAt
      ),
      dataSources: mapDataSources(item.dataSources),
    }
  })
}

export const countNotificationsOccurredToday = (
  items: NotificationListItemViewModel[],
  now: Date = new Date()
): number => {
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()

  return items.filter((item) => {
    const occurred = new Date(item.lastActivityOccurredAt)
    return (
      !Number.isNaN(occurred.getTime()) &&
      occurred.getFullYear() === year &&
      occurred.getMonth() === month &&
      occurred.getDate() === date
    )
  }).length
}
