import { describe, expect, it, vi } from "vitest"
import {
  ACTIVITY_SORT_FIELDS,
  ACTIVITY_SORT_ORDER,
  ACTIVITY_STATUS,
  MAX_ACTIVITIES_PER_PAGE,
  type DataSourceActivitiesListResult,
} from "../../../domain"
import type { ActivityQueryRepository } from "../../../domain/repositories/activity-query.repository"
import { ListDataSourceActivitiesUseCase } from "../list-data-source-activities.use-case"

const createActivityQueryRepository = (
  result: DataSourceActivitiesListResult | null,
) => {
  return {
    listUserActivities: vi.fn(),
    listDataSourceActivities: vi.fn().mockResolvedValue(result),
    getActivityDetail: vi.fn(),
  } satisfies ActivityQueryRepository
}

describe("ListDataSourceActivitiesUseCase", () => {
  it("ウォッチしていないデータソースの場合はnullを返す", async () => {
    const repository = createActivityQueryRepository(null)
    const useCase = new ListDataSourceActivitiesUseCase(repository)

    const result = await useCase.execute({
      userId: "user-1",
      dataSourceId: "ds-1",
    })

    expect(result).toBeNull()
    expect(repository.listDataSourceActivities).toHaveBeenCalledWith({
      userId: "user-1",
      dataSourceId: "ds-1",
      page: 1,
      perPage: 20,
      sort: ACTIVITY_SORT_FIELDS.CREATED_AT,
      order: ACTIVITY_SORT_ORDER.DESC,
      filters: {
        activityType: undefined,
        status: ACTIVITY_STATUS.COMPLETED,
        since: undefined,
        until: undefined,
      },
    })
  })

  it("クエリオプションを正規化して返却する", async () => {
    const dataSourceActivities: DataSourceActivitiesListResult = {
      dataSource: {
        id: "ds-1",
        sourceType: "github",
        name: "repo",
        url: "https://example.com",
        metadata: undefined,
      },
      items: [],
      pagination: {
        page: 1,
        perPage: 1,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }

    const repository = createActivityQueryRepository(dataSourceActivities)
    const useCase = new ListDataSourceActivitiesUseCase(repository)

    const result = await useCase.execute({
      userId: "user-1",
      dataSourceId: "ds-1",
      page: 2.8,
      perPage: 500,
      activityType: "issue",
      status: ACTIVITY_STATUS.PROCESSING,
      sort: ACTIVITY_SORT_FIELDS.UPDATED_AT,
      order: ACTIVITY_SORT_ORDER.ASC,
    })

    expect(repository.listDataSourceActivities).toHaveBeenCalledWith({
      userId: "user-1",
      dataSourceId: "ds-1",
      page: 2,
      perPage: MAX_ACTIVITIES_PER_PAGE,
      sort: ACTIVITY_SORT_FIELDS.UPDATED_AT,
      order: ACTIVITY_SORT_ORDER.ASC,
      filters: {
        activityType: "issue",
        status: ACTIVITY_STATUS.PROCESSING,
        since: undefined,
        until: undefined,
      },
    })
    expect(result).toBe(dataSourceActivities)
  })
})
