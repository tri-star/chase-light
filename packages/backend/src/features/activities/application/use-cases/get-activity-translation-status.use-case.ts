import type { ActivityBodyTranslationState } from "../../domain"
import type { ActivityTranslationStateRepository } from "../../domain/repositories/activity-translation-state.repository"

export type GetActivityTranslationStatusInput = {
  userId: string
  activityId: string
}

export class GetActivityTranslationStatusUseCase {
  constructor(
    private readonly translationStateRepository: ActivityTranslationStateRepository,
  ) {}

  async execute(
    input: GetActivityTranslationStatusInput,
  ): Promise<ActivityBodyTranslationState | null> {
    return this.translationStateRepository.findByUserAndActivityId(
      input.userId,
      input.activityId,
    )
  }
}
