import type { ActivityDetail } from "../../domain"
import type { ActivityQueryRepository } from "../../domain/repositories/activity-query.repository"

export type GetActivityDetailInput = {
  userId: string
  activityId: string
}

export class GetActivityDetailUseCase {
  constructor(
    private readonly activityQueryRepository: ActivityQueryRepository,
  ) {}

  async execute(input: GetActivityDetailInput): Promise<ActivityDetail | null> {
    return await this.activityQueryRepository.getActivityDetail({
      userId: input.userId,
      activityId: input.activityId,
    })
  }
}
