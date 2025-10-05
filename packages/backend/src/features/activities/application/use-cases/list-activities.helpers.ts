import {
  ACTIVITY_SORT_FIELDS,
  ACTIVITY_SORT_ORDER,
  DEFAULT_ACTIVITIES_PAGE,
  DEFAULT_ACTIVITIES_PER_PAGE,
  DEFAULT_ACTIVITY_STATUS_FILTER,
  MAX_ACTIVITIES_PER_PAGE,
  type ActivitiesListFilters,
  type ActivitySortField,
  type ActivitySortOrder,
  type ActivityStatus,
  type ActivityType,
} from "../../domain"

export type ActivitiesListInputOptions = {
  page?: number
  perPage?: number
  activityType?: ActivityType
  status?: ActivityStatus
  since?: Date
  until?: Date
  sort?: ActivitySortField
  order?: ActivitySortOrder
}

export type NormalizedActivitiesListOptions = {
  page: number
  perPage: number
  sort: ActivitySortField
  order: ActivitySortOrder
  filters: ActivitiesListFilters
}

export function normalizeActivitiesListOptions(
  options: ActivitiesListInputOptions,
): NormalizedActivitiesListOptions {
  const page = normalizePage(options.page)
  const perPage = normalizePerPage(options.perPage)
  const sort = options.sort ?? ACTIVITY_SORT_FIELDS.CREATED_AT
  const order = options.order ?? ACTIVITY_SORT_ORDER.DESC

  const filters: ActivitiesListFilters = {
    activityType: options.activityType,
    status: options.status ?? DEFAULT_ACTIVITY_STATUS_FILTER,
    since: options.since,
    until: options.until,
  }

  return {
    page,
    perPage,
    sort,
    order,
    filters,
  }
}

function normalizePage(page?: number): number {
  if (typeof page !== "number" || !Number.isFinite(page)) {
    return DEFAULT_ACTIVITIES_PAGE
  }

  return Math.max(Math.trunc(page), 1)
}

function normalizePerPage(perPage?: number): number {
  if (typeof perPage !== "number" || !Number.isFinite(perPage)) {
    return DEFAULT_ACTIVITIES_PER_PAGE
  }

  const normalized = Math.max(Math.trunc(perPage), 1)
  return Math.min(normalized, MAX_ACTIVITIES_PER_PAGE)
}
