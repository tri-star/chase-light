export const MonitoringJobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type MonitoringJobStatusType =
  (typeof MonitoringJobStatus)[keyof typeof MonitoringJobStatus]

export type MonitoringJob = {
  id: string
  status: MonitoringJobStatusType
  dataSourceId: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
}