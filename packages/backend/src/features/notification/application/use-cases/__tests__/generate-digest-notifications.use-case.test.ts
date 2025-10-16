import { describe, expect, it } from "vitest"
import { GenerateDigestNotificationsUseCase } from "../generate-digest-notifications.use-case"
import type {
  NotificationPreparationRepository,
  FindNotificationTargetsParams,
} from "../../../domain/repositories/notification-preparation.repository"
import type {
  NotificationRepository,
  CreateNotificationsResult,
} from "../../../domain/repositories/notification.repository"
import type { NotificationDraft, NotificationTarget } from "../../../domain"

class StubNotificationPreparationRepository
  implements NotificationPreparationRepository
{
  constructor(private readonly targets: NotificationTarget[]) {}

  async findPendingTargets(
    _params: FindNotificationTargetsParams,
  ): Promise<NotificationTarget[]> {
    return this.targets
  }
}

class StubNotificationRepository implements NotificationRepository {
  public recordedDrafts: NotificationDraft[] | null = null
  public result: CreateNotificationsResult | Error = {
    created: 0,
    skippedByConflict: 0,
  }

  async createMany(
    drafts: NotificationDraft[],
  ): Promise<CreateNotificationsResult> {
    this.recordedDrafts = drafts
    if (this.result instanceof Error) {
      throw this.result
    }
    return this.result
  }
}

const baseTarget: NotificationTarget = {
  activity: {
    id: "activity-1",
    type: "release",
    createdAt: new Date("2025-10-16T00:00:00Z"),
    dataSourceId: "ds-1",
    dataSourceName: "owner/repo",
    title: "v1.0.0",
  },
  recipient: {
    id: "user-1",
    timezone: "Asia/Tokyo",
    digest: {
      enabled: true,
      times: ["18:00"],
      timezone: "Asia/Tokyo",
    },
    channels: ["digest"],
  },
}

describe("GenerateDigestNotificationsUseCase", () => {
  it("抽出結果が0件の場合は空の結果を返す", async () => {
    const preparation = new StubNotificationPreparationRepository([])
    const repository = new StubNotificationRepository()
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    const result = await useCase.execute()

    expect(result).toEqual({
      created: 0,
      skippedByConflict: 0,
      totalExamined: 0,
      lastProcessedActivityId: null,
    })
    expect(repository.recordedDrafts).toBeNull()
  })

  it("通知を生成して保存する", async () => {
    const preparation = new StubNotificationPreparationRepository([baseTarget])
    const repository = new StubNotificationRepository()
    repository.result = { created: 1, skippedByConflict: 0 }
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    const result = await useCase.execute({ limit: 10 })

    expect(result.created).toBe(1)
    expect(result.skippedByConflict).toBe(0)
    expect(result.totalExamined).toBe(1)
    expect(result.lastProcessedActivityId).toBe("activity-1")
    expect(repository.recordedDrafts).not.toBeNull()
    expect(repository.recordedDrafts?.[0]).toMatchObject({
      activityId: "activity-1",
      userId: "user-1",
      notificationType: "activity_digest",
      metadata: {
        activityType: "release",
        dataSourceId: "ds-1",
        dataSourceName: "owner/repo",
        scheduledSlot: "18:00",
        digestTimezone: "Asia/Tokyo",
      },
    })
  })

  it("dryRunの場合はDBへ保存しない", async () => {
    const preparation = new StubNotificationPreparationRepository([baseTarget])
    const repository = new StubNotificationRepository()
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    const result = await useCase.execute({ dryRun: true })

    expect(result.created).toBe(0)
    expect(result.skippedByConflict).toBe(0)
    expect(result.totalExamined).toBe(1)
    expect(repository.recordedDrafts).toBeNull()
  })

  it("リポジトリが競合を返した場合は集計に反映する", async () => {
    const preparation = new StubNotificationPreparationRepository([baseTarget])
    const repository = new StubNotificationRepository()
    repository.result = { created: 0, skippedByConflict: 1 }
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    const result = await useCase.execute()

    expect(result.created).toBe(0)
    expect(result.skippedByConflict).toBe(1)
  })

  it("リポジトリが例外を投げた場合はそのまま伝播する", async () => {
    const preparation = new StubNotificationPreparationRepository([baseTarget])
    const repository = new StubNotificationRepository()
    repository.result = new Error("DB error")
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    await expect(() => useCase.execute()).rejects.toThrow("DB error")
  })

  it("ダイジェストが無効な受信者はスキップする", async () => {
    const disabledTarget: NotificationTarget = {
      ...baseTarget,
      recipient: {
        ...baseTarget.recipient,
        digest: {
          ...baseTarget.recipient.digest,
          enabled: false,
        },
      },
    }
    const preparation = new StubNotificationPreparationRepository([
      disabledTarget,
    ])
    const repository = new StubNotificationRepository()
    const useCase = new GenerateDigestNotificationsUseCase(
      preparation,
      repository,
      () => new Date("2025-10-16T09:00:00Z"),
    )

    const result = await useCase.execute()

    expect(result.created).toBe(0)
    expect(repository.recordedDrafts).toBeNull()
  })
})
