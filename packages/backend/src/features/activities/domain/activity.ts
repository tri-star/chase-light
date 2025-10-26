/**
 * アクティビティ機能で共有するドメイン定義とDTO
 */

export const ACTIVITY_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS]

export const ACTIVITY_TYPE = {
  RELEASE: "release",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const

export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE]

export const ACTIVITY_SORT_FIELDS = {
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
} as const

export type ActivitySortField =
  (typeof ACTIVITY_SORT_FIELDS)[keyof typeof ACTIVITY_SORT_FIELDS]

export const ACTIVITY_SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
} as const

export type ActivitySortOrder =
  (typeof ACTIVITY_SORT_ORDER)[keyof typeof ACTIVITY_SORT_ORDER]

export const DEFAULT_ACTIVITIES_PAGE = 1
export const DEFAULT_ACTIVITIES_PER_PAGE = 20
export const MAX_ACTIVITIES_PER_PAGE = 100

export const DEFAULT_ACTIVITY_STATUS_FILTER: ActivityStatus =
  ACTIVITY_STATUS.COMPLETED

export const isTerminalStatus = (status: ActivityStatus): boolean =>
  status === ACTIVITY_STATUS.COMPLETED || status === ACTIVITY_STATUS.FAILED

export type ActivityRecord = {
  id: string
  dataSourceId: string
  githubEventId: string
  activityType: ActivityType
  title: string
  body: string
  translatedTitle: string | null
  summary: string | null
  translatedBody: string | null
  version: string | null
  status: ActivityStatus
  statusDetail: string | null
  githubData: string | null
  createdAt: Date
  updatedAt: Date
}

export type Activity = ActivityRecord

export type ActivitySourceMetadata = {
  repositoryFullName?: string
  repositoryLanguage?: string | null
  starsCount?: number
  forksCount?: number
  openIssuesCount?: number
}

export type ActivitySourceSummary = {
  id: string
  sourceType: string
  name: string
  url: string
  metadata?: ActivitySourceMetadata
}

export type ActivityListItemSummary = {
  id: string
  activityType: ActivityType
  title: string
  translatedTitle: string | null
  summary: string | null
  detail?: string | null
  translatedBody: string | null
  status: ActivityStatus
  statusDetail: string | null
  version: string | null
  occurredAt: Date
  lastUpdatedAt: Date
  source: ActivitySourceSummary
}

export type ActivityListItem = {
  activity: ActivityListItemSummary
}

export type ActivityDetail = {
  activity: Omit<ActivityListItemSummary, "detail"> & {
    detail: string
  }
}

export type ActivitiesPaginationMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type ActivityListResult = {
  items: ActivityListItem[]
  pagination: ActivitiesPaginationMeta
}

export type DataSourceActivitiesListResult = ActivityListResult & {
  dataSource: ActivitySourceSummary
}

export type ActivitiesListFilters = {
  activityType?: ActivityType
  status?: ActivityStatus
  since?: Date
  until?: Date
}

export type ActivitiesListQuery = {
  userId: string
  page: number
  perPage: number
  sort: ActivitySortField
  order: ActivitySortOrder
  filters: ActivitiesListFilters
}

export type DataSourceActivitiesListQuery = ActivitiesListQuery & {
  dataSourceId: string
}

export type ActivityDetailQuery = {
  userId: string
  activityId: string
}
