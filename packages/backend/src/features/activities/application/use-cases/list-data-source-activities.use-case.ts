import type { DataSourceActivitiesListResult } from "../../domain"
import type { ActivityQueryRepository } from "../../domain/repositories/activity-query.repository"
import type {
  ActivitiesListInputOptions,
  NormalizedActivitiesListOptions,
} from "./list-activities.helpers"
import { normalizeActivitiesListOptions } from "./list-activities.helpers"

export type ListDataSourceActivitiesInput = ActivitiesListInputOptions & {
  userId: string
  dataSourceId: string
}

export class ListDataSourceActivitiesUseCase {
  constructor(
    private readonly activityQueryRepository: ActivityQueryRepository,
  ) {}

  async execute(
    input: ListDataSourceActivitiesInput,
  ): Promise<DataSourceActivitiesListResult | null> {
    const normalized = this.normalizeOptions(input)

    return await this.activityQueryRepository.listDataSourceActivities({
      userId: input.userId,
      dataSourceId: input.dataSourceId,
      page: normalized.page,
      perPage: normalized.perPage,
      sort: normalized.sort,
      order: normalized.order,
      filters: normalized.filters,
    })
  }

  private normalizeOptions(
    input: ListDataSourceActivitiesInput,
  ): NormalizedActivitiesListOptions {
    return normalizeActivitiesListOptions(input)
  }
}
