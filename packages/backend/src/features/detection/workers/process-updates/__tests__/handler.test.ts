import { describe, test, beforeEach, expect, vi } from "vitest"
import type { Context } from "aws-lambda"
import { randomUUID } from "crypto"
import { handler } from "../handler"
import { setupComponentTest, TestDataFactory } from "../../../../../test"
import { DrizzleActivityRepository } from "../../../infra/repositories"
import {
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  type Activity,
} from "../../../domain/activity"
import { DATA_SOURCE_TYPES } from "../../../../data-sources/domain/data-source"
import { toDetectTargetId } from "../../../domain/detect-target"

describe("process-updates handler", () => {
  setupComponentTest()

  let activityRepository: DrizzleActivityRepository
  let mockContext: Context
  let testDataSourceId: string

  const createTestEvent = (overrides: Partial<Activity> = {}): Activity => {
    const defaultEvent: Activity = {
      id: randomUUID(),
      dataSourceId: testDataSourceId,
      githubEventId: `test-event-${randomUUID()}`,
      activityType: ACTIVITY_TYPE.RELEASE,
      title: "Test Event",
      body: "Test event body",
      version: "v1.0.0",
      status: ACTIVITY_STATUS.PENDING,
      statusDetail: null,
      githubData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return { ...defaultEvent, ...overrides }
  }

  beforeEach(async () => {
    activityRepository = new DrizzleActivityRepository()

    const testDataSource = await TestDataFactory.createTestDataSource({
      sourceId: "test/repository",
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      repository: {
        githubId: 123456,
        fullName: "test/repository",
      },
    })
    testDataSourceId = testDataSource.id

    mockContext = {
      awsRequestId: "test-request-id",
      logGroupName: "test-log-group",
      logStreamName: "test-log-stream",
      functionName: "process-updates",
      functionVersion: "1",
      invokedFunctionArn:
        "arn:aws:lambda:us-east-1:123456789012:function:process-updates",
      memoryLimitInMB: "128",
      getRemainingTimeInMillis: () => 30000,
      callbackWaitsForEmptyEventLoop: true,
      done: vi.fn(),
      fail: vi.fn(),
      succeed: vi.fn(),
    }

    process.env.OPENAI_API_KEY = "test-api-key"
  })

  test("複数のイベントを正常に処理できる", async () => {
    const event1 = createTestEvent({
      title: "Version 1.0.0",
      body: "Initial release with new features",
      activityType: ACTIVITY_TYPE.RELEASE,
    })

    await activityRepository.upsert({
      ...event1,
      detectTargetId: toDetectTargetId(event1.dataSourceId),
    })

    const { TranslationAdapter } = await import(
      "../../../infra/adapters/translation/translation.adapter"
    )
    const originalTranslate = TranslationAdapter.prototype.translate
    TranslationAdapter.prototype.translate = vi.fn().mockResolvedValue({
      translatedTitle: "[翻訳済み] テストタイトル",
      translatedBody: "[翻訳済み] テスト本文",
    })

    try {
      const result = await handler({ activityId: event1.id }, mockContext)

      expect(result.processedActivityIds).toHaveLength(1)
      expect(result.failedActivityIds).toHaveLength(0)
      expect(result.processedActivityIds).toEqual(
        expect.arrayContaining([event1.id]),
      )

      const updatedEvent = await activityRepository.findById(event1.id)
      expect(updatedEvent).not.toBeNull()
      expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.COMPLETED)
      expect(updatedEvent!.title).toBe("[翻訳済み] テストタイトル")
      expect(updatedEvent!.body).toBe("[翻訳済み] テスト本文")
    } finally {
      TranslationAdapter.prototype.translate = originalTranslate
    }
  })

  test("既に処理済みのイベントはスキップされる", async () => {
    const completedEvent = createTestEvent({
      title: "Already completed",
      body: "This is already processed",
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
    })

    await activityRepository.upsert({
      ...completedEvent,
      detectTargetId: toDetectTargetId(completedEvent.dataSourceId),
    })

    const { TranslationAdapter } = await import(
      "../../../infra/adapters/translation/translation.adapter"
    )
    const originalTranslate = TranslationAdapter.prototype.translate
    const mockTranslate = vi.fn().mockResolvedValue({
      translatedTitle: "[翻訳済み] テストタイトル",
      translatedBody: "[翻訳済み] テスト本文",
    })
    TranslationAdapter.prototype.translate = mockTranslate

    try {
      const result = await handler(
        { activityId: completedEvent.id },
        mockContext,
      )

      expect(result.processedActivityIds).toHaveLength(0)
      expect(result.failedActivityIds).toHaveLength(0)
      expect(mockTranslate).not.toHaveBeenCalled()
    } finally {
      TranslationAdapter.prototype.translate = originalTranslate
    }
  })

  test("翻訳アダプタでエラーが発生した場合は失敗として記録される", async () => {
    const event = createTestEvent()

    await activityRepository.upsert({
      ...event,
      detectTargetId: toDetectTargetId(event.dataSourceId),
    })

    const { TranslationAdapter } = await import(
      "../../../infra/adapters/translation/translation.adapter"
    )
    const originalTranslate = TranslationAdapter.prototype.translate
    TranslationAdapter.prototype.translate = vi
      .fn()
      .mockRejectedValue(new Error("translation failed"))

    try {
      const result = await handler({ activityId: event.id }, mockContext)

      expect(result.processedActivityIds).toHaveLength(0)
      expect(result.failedActivityIds).toEqual(
        expect.arrayContaining([event.id]),
      )

      const updatedEvent = await activityRepository.findById(event.id)
      expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.FAILED)
      expect(updatedEvent!.statusDetail).toContain("translation failed")
    } finally {
      TranslationAdapter.prototype.translate = originalTranslate
    }
  })
})
