export const CheckResultStatus = {
  SUCCESS: "success",
  ERROR: "error",
  NO_CHANGES: "no_changes",
  RATE_LIMITED: "rate_limited",
} as const

export type CheckResultStatusType =
  (typeof CheckResultStatus)[keyof typeof CheckResultStatus]

export type RepositoryCheckResult = {
  dataSourceId: string
  status: CheckResultStatusType
  lastCheckedAt: Date
  newEventsCount: number
  errorMessage?: string
}
