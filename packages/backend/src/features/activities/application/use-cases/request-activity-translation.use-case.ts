import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  isActivityBodyTranslationTerminalStatus,
} from "shared/constants"
import {
  DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE,
  type ActivityBodyTranslationState,
} from "../../domain"
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

    if (!input.force) {
      const isTerminal = isActivityBodyTranslationTerminalStatus(
        existingState.translationStatus,
      )
      const hasBody = !!existingState.translatedBody
      const isInProgress =
        existingState.translationStatus ===
          ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED ||
        existingState.translationStatus ===
          ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING

      // 完了済みで本文がある場合、または処理中の場合は再投入しない
      if ((isTerminal && hasBody) || isInProgress) {
        return existingState
      }
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
