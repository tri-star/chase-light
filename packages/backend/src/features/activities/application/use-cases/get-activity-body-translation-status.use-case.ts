import type { Activity } from "../../domain"
import type { ActivityRepository } from "../../domain/repositories/activity.repository"

export type GetActivityBodyTranslationStatusInput = {
  userId: string
  activityId: string
}

export type GetActivityBodyTranslationStatusResult =
  | { status: "not_found" }
  | { status: "ok"; activity: Activity }

export class GetActivityBodyTranslationStatusUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(
    input: GetActivityBodyTranslationStatusInput,
  ): Promise<GetActivityBodyTranslationStatusResult> {
    const activity = await this.activityRepository.findByIdWithWatch(
      input.activityId,
      input.userId,
    )

    if (!activity) {
      return { status: "not_found" }
    }

    return { status: "ok", activity }
  }
}
