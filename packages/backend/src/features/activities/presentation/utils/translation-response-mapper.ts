import { ACTIVITY_BODY_TRANSLATION_STATUS } from "../../domain"
import type { ActivityBodyTranslationState } from "../../domain"

const toISOString = (value: Date): string => value.toISOString()
const toISOStringOptional = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null

export const mapTranslationStateToResponse = (
  state: ActivityBodyTranslationState,
) => ({
  success: true as const,
  data: {
    jobId: state.translationMessageId,
    translationStatus: state.translationStatus,
    statusDetail: state.translationStatusDetail,
    requestedAt: toISOString(state.translationRequestedAt),
    startedAt: toISOStringOptional(state.translationStartedAt),
    completedAt: toISOStringOptional(state.translationCompletedAt),
  },
})

export const resolveTranslationStatusHttpStatus = (
  state: ActivityBodyTranslationState & { enqueued?: boolean },
): 200 | 202 => {
  if (state.enqueued) {
    return 202
  }

  if (
    state.translationStatus === ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED ||
    state.translationStatus === ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING
  ) {
    return 202
  }

  return 200
}
