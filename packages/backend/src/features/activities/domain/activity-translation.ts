import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  DEFAULT_ACTIVITY_BODY_TRANSLATION_TARGET_LANGUAGE,
  isActivityBodyTranslationTerminalStatus,
} from "shared"
import type {
  ActivityBodyTranslationStatus,
  ActivityBodyTranslationTargetLanguage,
} from "shared"

export type ActivityBodyTranslationState = {
  activityId: string
  body: string
  translationStatus: ActivityBodyTranslationStatus
  translationStatusDetail: string | null
  translationRequestedAt: Date
  translationStartedAt: Date | null
  translationCompletedAt: Date | null
  translationMessageId: string | null
  translatedBody: string | null
}

export type ActivityBodyTranslationRequest = {
  activityId: string
  targetLanguage?: ActivityBodyTranslationTargetLanguage
  force?: boolean
}

export const DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE: ActivityBodyTranslationTargetLanguage =
  DEFAULT_ACTIVITY_BODY_TRANSLATION_TARGET_LANGUAGE

export {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  isActivityBodyTranslationTerminalStatus,
}

export type {
  ActivityBodyTranslationStatus,
  ActivityBodyTranslationTargetLanguage,
}
