import type { ActivityBodyTranslationState } from "../activity-translation"

export type ActivityBodyTranslationStateUpdate = Pick<
  ActivityBodyTranslationState,
  | "translationStatus"
  | "translationStatusDetail"
  | "translationRequestedAt"
  | "translationStartedAt"
  | "translationCompletedAt"
  | "translationMessageId"
  | "translatedBody"
>

export type MarkActivityBodyTranslationQueuedInput = {
  activityId: string
  requestedAt: Date
  messageId?: string | null
  statusDetail?: string | null
}

export type MarkActivityBodyTranslationProcessingInput = {
  activityId: string
  startedAt: Date
  messageId?: string | null
  statusDetail?: string | null
}

export type MarkActivityBodyTranslationCompletedInput = {
  activityId: string
  translatedBody: string
  completedAt: Date
  statusDetail?: string | null
}

export type MarkActivityBodyTranslationFailedInput = {
  activityId: string
  completedAt?: Date
  statusDetail?: string | null
}

export interface ActivityTranslationStateRepository {
  findByActivityId(
    activityId: string,
  ): Promise<ActivityBodyTranslationState | null>
  updateTranslationState(
    activityId: string,
    state: Partial<ActivityBodyTranslationStateUpdate>,
  ): Promise<ActivityBodyTranslationState | null>
  markQueued(
    input: MarkActivityBodyTranslationQueuedInput,
  ): Promise<ActivityBodyTranslationState | null>
  markProcessing(
    input: MarkActivityBodyTranslationProcessingInput,
  ): Promise<ActivityBodyTranslationState | null>
  markCompleted(
    input: MarkActivityBodyTranslationCompletedInput,
  ): Promise<ActivityBodyTranslationState | null>
  markFailed(
    input: MarkActivityBodyTranslationFailedInput,
  ): Promise<ActivityBodyTranslationState | null>
  updateStatusDetail(
    activityId: string,
    statusDetail: string | null,
  ): Promise<ActivityBodyTranslationState | null>
}
