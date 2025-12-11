export const ACTIVITY_BODY_TRANSLATION_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export type ActivityBodyTranslationStatus =
  (typeof ACTIVITY_BODY_TRANSLATION_STATUS)[keyof typeof ACTIVITY_BODY_TRANSLATION_STATUS]

export const DEFAULT_ACTIVITY_BODY_TRANSLATION_TARGET_LANGUAGE = "ja" as const

export type ActivityBodyTranslationTargetLanguage =
  typeof DEFAULT_ACTIVITY_BODY_TRANSLATION_TARGET_LANGUAGE

export const isActivityBodyTranslationTerminalStatus = (
  status: ActivityBodyTranslationStatus,
): boolean =>
  status === ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED ||
  status === ACTIVITY_BODY_TRANSLATION_STATUS.FAILED
