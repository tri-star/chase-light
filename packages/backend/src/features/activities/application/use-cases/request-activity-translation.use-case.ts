import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE,
  isActivityBodyTranslationTerminalStatus,
} from "../../domain"
import type { ActivityBodyTranslationState } from "../../domain"
import type {
  ActivityTranslationStateRepository,
  MarkActivityBodyTranslationQueuedInput,
} from "../../domain/repositories/activity-translation-state.repository"
import type {
  TranslationJobPayload,
  TranslationJobQueuePort,
} from "../ports/translation-job-queue.port"

export type RequestActivityTranslationInput = {
  userId: string
  activityId: string
  targetLanguage?: TranslationJobPayload["targetLanguage"]
  force?: boolean
}

export type RequestActivityTranslationResult = ActivityBodyTranslationState & {
  enqueued?: boolean
}

export class RequestActivityTranslationUseCase {
  constructor(
    private readonly translationStateRepository: ActivityTranslationStateRepository,
    private readonly translationJobQueue: TranslationJobQueuePort,
  ) {}

  async execute(
    input: RequestActivityTranslationInput,
  ): Promise<RequestActivityTranslationResult | null> {
    const targetLanguage =
      input.targetLanguage ?? DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE

    const existingState =
      await this.translationStateRepository.findByUserAndActivityId(
        input.userId,
        input.activityId,
      )

    if (!existingState) {
      return null
    }

    const isInProgress =
      existingState.translationStatus ===
        ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED ||
      existingState.translationStatus ===
        ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING

    if (
      !input.force &&
      isActivityBodyTranslationTerminalStatus(existingState.translationStatus)
    ) {
      if (existingState.translatedBody) {
        return existingState
      }
    }

    if (!input.force && isInProgress) {
      return existingState
    }

    const queued = await this.enqueueJob(existingState.activityId, {
      activityId: existingState.activityId,
      targetLanguage,
    })

    return queued
  }

  private async enqueueJob(
    activityId: string,
    job: TranslationJobPayload,
  ): Promise<RequestActivityTranslationResult | null> {
    const requestedAt = new Date()
    const { messageId } = await this.translationJobQueue.enqueue(job)

    const queuedState = await this.translationStateRepository.markQueued(
      this.buildQueuedInput(activityId, requestedAt, messageId),
    )

    if (!queuedState) {
      return null
    }

    return { ...queuedState, enqueued: true }
  }

  private buildQueuedInput(
    activityId: string,
    requestedAt: Date,
    messageId: string | null,
  ): MarkActivityBodyTranslationQueuedInput {
    return {
      activityId,
      requestedAt,
      messageId,
      statusDetail: null,
    }
  }
}
