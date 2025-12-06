import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  type ActivityBodyTranslationStatus,
} from "shared"
import type { ActivityType } from "./activity"

export type ActivityBodyTranslationState = {
  status: ActivityBodyTranslationStatus
  requestedAt: Date | null
  startedAt: Date | null
  completedAt: Date | null
  error: string | null
}

export type ActivityBodyTranslationJob = {
  activityId: string
  activityType: ActivityType
  title: string
  body: string
  currentState: ActivityBodyTranslationState
}

export const isBodyTranslationInProgress = (
  status: ActivityBodyTranslationStatus,
): boolean =>
  status === ACTIVITY_BODY_TRANSLATION_STATUS.PENDING ||
  status === ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING

export const isBodyTranslationRequested = (
  status: ActivityBodyTranslationStatus,
): boolean => status !== ACTIVITY_BODY_TRANSLATION_STATUS.NOT_REQUESTED

export const buildBodyTranslationState = (
  status: ActivityBodyTranslationStatus,
  requestedAt: Date | null,
  startedAt: Date | null,
  completedAt: Date | null,
  error: string | null,
): ActivityBodyTranslationState => ({
  status,
  requestedAt,
  startedAt,
  completedAt,
  error,
})
