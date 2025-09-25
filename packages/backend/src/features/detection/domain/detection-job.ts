export const DetectJobStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export type DetectJobStatusType =
  (typeof DetectJobStatus)[keyof typeof DetectJobStatus]

export type DetectionJob = {
  id: string
  status: DetectJobStatusType
  dataSourceId: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
}
