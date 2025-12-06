import { ACTIVITY_BODY_TRANSLATION_STATUS, type Activity } from "../../domain"
import { isBodyTranslationInProgress } from "../../domain/activity-body-translation"
import type { ActivityRepository } from "../../domain/repositories/activity.repository"

export type RequestActivityBodyTranslationInput = {
  userId: string
  activityId: string
  force?: boolean
}

export type RequestActivityBodyTranslationResult =
  | {
      status: "accepted"
      activity: Activity
    }
  | {
      status: "conflict"
      activity: Activity
    }
  | {
      status: "already_completed"
      activity: Activity
    }
  | {
      status: "not_found"
    }

export class RequestActivityBodyTranslationUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(
    input: RequestActivityBodyTranslationInput,
  ): Promise<RequestActivityBodyTranslationResult> {
    const activity = await this.activityRepository.findByIdWithWatch(
      input.activityId,
      input.userId,
    )

    if (!activity) {
      return { status: "not_found" }
    }

    if (
      activity.bodyTranslationStatus ===
        ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED &&
      !input.force
    ) {
      return { status: "already_completed", activity }
    }

    if (
      activity.bodyTranslationStatus ===
        ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING &&
      !input.force
    ) {
      return { status: "conflict", activity }
    }

    const now = new Date()
    const allowedStatuses: (typeof activity.bodyTranslationStatus)[] = [
      ACTIVITY_BODY_TRANSLATION_STATUS.NOT_REQUESTED,
      ACTIVITY_BODY_TRANSLATION_STATUS.PENDING,
      ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
    ]

    if (input.force) {
      allowedStatuses.push(ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED)
      allowedStatuses.push(ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING)
    }

    await this.activityRepository.updateBodyTranslationState(
      activity.id,
      {
        status: ACTIVITY_BODY_TRANSLATION_STATUS.PENDING,
        requestedAt: now,
        startedAt: null,
        completedAt: null,
        error: null,
      },
      allowedStatuses,
    )

    const updated = await this.activityRepository.findById(activity.id)
    if (!updated) {
      return { status: "not_found" }
    }

    const nextStatus = isBodyTranslationInProgress(
      updated.bodyTranslationStatus,
    )
      ? "accepted"
      : "conflict"

    return { status: nextStatus, activity: updated }
  }
}
