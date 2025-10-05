import { describe, expect, it, vi } from "vitest"
import type { ActivityDetail } from "../../../domain"
import type { ActivityQueryRepository } from "../../../domain/repositories/activity-query.repository"
import { GetActivityDetailUseCase } from "../get-activity-detail.use-case"

const createActivityQueryRepository = (result: ActivityDetail | null) => {
  return {
    listUserActivities: vi.fn(),
    listDataSourceActivities: vi.fn(),
    getActivityDetail: vi.fn().mockResolvedValue(result),
  } satisfies ActivityQueryRepository
}

describe("GetActivityDetailUseCase", () => {
  it("アクティビティ詳細を返却する", async () => {
    const activityDetail: ActivityDetail = {
      activity: {
        id: "activity-1",
        activityType: "release",
        title: "Release v1.0",
        summary: "Summary",
        detail: "Detail",
        status: "completed",
        statusDetail: null,
        version: "v1.0",
        occurredAt: new Date("2024-01-01T00:00:00Z"),
        lastUpdatedAt: new Date("2024-01-01T01:00:00Z"),
        source: {
          id: "ds-1",
          sourceType: "github",
          name: "repo",
          url: "https://example.com",
          metadata: undefined,
        },
      },
    }

    const repository = createActivityQueryRepository(activityDetail)
    const useCase = new GetActivityDetailUseCase(repository)

    const result = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    })

    expect(repository.getActivityDetail).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "activity-1",
    })
    expect(result).toBe(activityDetail)
  })

  it("アクセス権がない場合はnullを返す", async () => {
    const repository = createActivityQueryRepository(null)
    const useCase = new GetActivityDetailUseCase(repository)

    const result = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    })

    expect(result).toBeNull()
  })
})
