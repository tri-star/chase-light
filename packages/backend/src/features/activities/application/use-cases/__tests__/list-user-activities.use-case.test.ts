import { describe, expect, it, vi } from "vitest"
import {
  ACTIVITY_SORT_FIELDS,
  ACTIVITY_SORT_ORDER,
  ACTIVITY_STATUS,
  DEFAULT_ACTIVITIES_PAGE,
  DEFAULT_ACTIVITIES_PER_PAGE,
  MAX_ACTIVITIES_PER_PAGE,
  type ActivityListResult,
} from "../../../domain"
import type { ActivityQueryRepository } from "../../../domain/repositories/activity-query.repository"
import { ListUserActivitiesUseCase } from "../list-user-activities.use-case"

const createActivityQueryRepository = () => {
  const defaultResult: ActivityListResult = {
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

  return {
    listUserActivities: vi.fn().mockResolvedValue(defaultResult),
    listDataSourceActivities: vi.fn(),
    getActivityDetail: vi.fn(),
  } satisfies ActivityQueryRepository
}

describe("ListUserActivitiesUseCase", () => {
  it("デフォルト値でアクティビティ一覧を取得する", async () => {
    const repository = createActivityQueryRepository()
    const useCase = new ListUserActivitiesUseCase(repository)

    await useCase.execute({ userId: "user-1" })

    expect(repository.listUserActivities).toHaveBeenCalledWith({
      userId: "user-1",
      page: DEFAULT_ACTIVITIES_PAGE,
      perPage: DEFAULT_ACTIVITIES_PER_PAGE,
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

  it("クエリオプションを正規化してリポジトリへ引き渡す", async () => {
    const repository = createActivityQueryRepository()
    const useCase = new ListUserActivitiesUseCase(repository)

    await useCase.execute({
      userId: "user-1",
      page: 0,
      perPage: 999,
      activityType: "release",
      status: ACTIVITY_STATUS.PENDING,
      since: new Date("2024-01-01T00:00:00Z"),
      until: new Date("2024-02-01T00:00:00Z"),
      sort: ACTIVITY_SORT_FIELDS.UPDATED_AT,
      order: ACTIVITY_SORT_ORDER.ASC,
    })

    expect(repository.listUserActivities).toHaveBeenLastCalledWith({
      userId: "user-1",
      page: 1,
      perPage: MAX_ACTIVITIES_PER_PAGE,
      sort: ACTIVITY_SORT_FIELDS.UPDATED_AT,
      order: ACTIVITY_SORT_ORDER.ASC,
      filters: {
        activityType: "release",
        status: ACTIVITY_STATUS.PENDING,
        since: new Date("2024-01-01T00:00:00.000Z"),
        until: new Date("2024-02-01T00:00:00.000Z"),
      },
    })
  })
})
