import { ACTIVITY_BODY_TRANSLATION_STATUS, type Activity } from "../../domain"
import type { ActivityBodyTranslationPort } from "../ports/activity-body-translation.port"
import type { ActivityRepository } from "../../domain/repositories/activity.repository"

export type ProcessActivityBodyTranslationInput = {
  activityId: string
}

export type ProcessActivityBodyTranslationResult =
  | { status: "completed"; activity: Activity }
  | { status: "failed"; activityId: string; error: string }
  | { status: "skipped"; reason: string }

export class ProcessActivityBodyTranslationUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly translationPort: ActivityBodyTranslationPort,
  ) {}

  async execute(
    input: ProcessActivityBodyTranslationInput,
  ): Promise<ProcessActivityBodyTranslationResult> {
    const activity = await this.activityRepository.findById(input.activityId)
    if (!activity) {
      return { status: "skipped", reason: "not_found" }
    }

    if (
      activity.bodyTranslationStatus !==
      ACTIVITY_BODY_TRANSLATION_STATUS.PENDING
    ) {
      return { status: "skipped", reason: "not_pending" }
    }

    const now = new Date()
    const transitioned =
      await this.activityRepository.updateBodyTranslationState(
        activity.id,
        {
          status: ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
          startedAt: now,
          error: null,
        },
        [ACTIVITY_BODY_TRANSLATION_STATUS.PENDING],
      )

    if (!transitioned) {
      return { status: "skipped", reason: "already_processing" }
    }

    try {
      const translation = await this.translationPort.translateBody(
        activity.activityType,
        activity.title,
        activity.body,
      )

      const completed =
        await this.activityRepository.updateBodyTranslationState(
          activity.id,
          {
            status: ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
            completedAt: new Date(),
            translatedBody: translation.translatedBody,
            translatedTitle: translation.translatedTitle,
            summary: translation.summary,
            error: null,
          },
          [ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING],
        )

      if (!completed) {
        return {
          status: "failed",
          activityId: activity.id,
          error: "state_conflict",
        }
      }

      const updated = await this.activityRepository.findById(activity.id)
      if (!updated) {
        return {
          status: "failed",
          activityId: activity.id,
          error: "missing_after_update",
        }
      }

      return { status: "completed", activity: updated }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error"

      await this.activityRepository.updateBodyTranslationState(
        activity.id,
        {
          status: ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
          error: message,
        },
        [ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING],
      )

      return { status: "failed", activityId: activity.id, error: message }
    }
  }
}
