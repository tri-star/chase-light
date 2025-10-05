import type { ActivityListResult } from "../../domain"
import type { ActivityQueryRepository } from "../../domain/repositories/activity-query.repository"
import type {
  ActivitiesListInputOptions,
  NormalizedActivitiesListOptions,
} from "./list-activities.helpers"
import { normalizeActivitiesListOptions } from "./list-activities.helpers"

export type ListUserActivitiesInput = ActivitiesListInputOptions & {
  userId: string
}

export class ListUserActivitiesUseCase {
  constructor(
    private readonly activityQueryRepository: ActivityQueryRepository,
  ) {}

  async execute(input: ListUserActivitiesInput): Promise<ActivityListResult> {
    const normalized = this.normalizeOptions(input)

    return await this.activityQueryRepository.listUserActivities({
      userId: input.userId,
      page: normalized.page,
      perPage: normalized.perPage,
      sort: normalized.sort,
      order: normalized.order,
      filters: normalized.filters,
    })
  }

  private normalizeOptions(
    input: ListUserActivitiesInput,
  ): NormalizedActivitiesListOptions {
    return normalizeActivitiesListOptions(input)
  }
}
