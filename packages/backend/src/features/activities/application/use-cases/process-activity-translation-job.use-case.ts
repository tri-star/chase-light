import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE,
  isActivityBodyTranslationTerminalStatus,
} from "../../domain"
import type {
  ActivityBodyTranslationState,
  ActivityBodyTranslationTargetLanguage,
} from "../../domain"
import type { ActivityTranslationStateRepository } from "../../domain/repositories/activity-translation-state.repository"
import type { BodyTranslationPort } from "../ports/body-translation.port"

export type ProcessActivityTranslationJobInput = {
  activityId: string
  targetLanguage?: string
}

export type ProcessActivityTranslationJobResult =
  ActivityBodyTranslationState | null

export class ProcessActivityTranslationJobUseCase {
  constructor(
    private readonly translationStateRepository: ActivityTranslationStateRepository,
    private readonly bodyTranslationPort: BodyTranslationPort,
  ) {}

  async execute(
    input: ProcessActivityTranslationJobInput,
  ): Promise<ProcessActivityTranslationJobResult> {
    const targetLanguage =
      (input.targetLanguage as
        | ActivityBodyTranslationTargetLanguage
        | undefined) ?? DEFAULT_ACTIVITY_BODY_TRANSLATION_LANGUAGE

    const currentState = await this.translationStateRepository.findByActivityId(
      input.activityId,
    )

    if (!currentState) {
      return null
    }

    if (
      isActivityBodyTranslationTerminalStatus(currentState.translationStatus)
    ) {
      return currentState
    }

    const processingState =
      await this.translationStateRepository.markProcessing({
        activityId: input.activityId,
        startedAt: new Date(),
        messageId: currentState.translationMessageId,
        statusDetail: null,
      })

    if (!processingState) {
      return null
    }

    try {
      const translation = await this.bodyTranslationPort.translate(
        currentState.body,
        targetLanguage,
      )

      const completed = await this.translationStateRepository.markCompleted({
        activityId: input.activityId,
        translatedBody: translation.translatedBody,
        completedAt: new Date(),
        statusDetail: null,
      })

      return completed
    } catch (error) {
      const statusDetail =
        error instanceof Error ? error.message : "Unknown error"

      await this.translationStateRepository.markFailed({
        activityId: input.activityId,
        completedAt: new Date(),
        statusDetail,
      })

      return {
        ...processingState,
        translationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
        translationStatusDetail: statusDetail,
      }
    }
  }
}
