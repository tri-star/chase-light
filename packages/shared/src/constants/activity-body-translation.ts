export const ACTIVITY_BODY_TRANSLATION_STATUS = {
  NOT_REQUESTED: "not_requested",
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export type ActivityBodyTranslationStatus =
  (typeof ACTIVITY_BODY_TRANSLATION_STATUS)[keyof typeof ACTIVITY_BODY_TRANSLATION_STATUS]
