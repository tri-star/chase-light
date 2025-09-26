import { describe, test, beforeEach, expect, vi } from "vitest"
import type { Context } from "aws-lambda"
import { handler } from "../handler"
import { setupComponentTest } from "../../../../../test"
import { DrizzleActivityRepository } from "../../../infra/repositories"
import { DataSourceRepository } from "../../../../data-sources/repositories/data-source.repository"
import {
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  type Activity,
} from "../../../domain/activity"
import { DATA_SOURCE_TYPES } from "../../../../data-sources/domain/data-source"
import { randomUUID } from "crypto"
import { toDetectTargetId } from "../../../domain/detect-target"

describe("process-updates handler", () => {
  setupComponentTest()

  let activityRepository: DrizzleActivityRepository
  let dataSourceRepository: DataSourceRepository
  let mockContext: Context
  let testDataSourceId: string

  // テストイベントデータファクトリ関数
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
    dataSourceRepository = new DataSourceRepository()

    // テスト用データソースを作成
    const testDataSource = await dataSourceRepository.save({
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: "test/repository",
      name: "Test Repository",
      description: "Test repository for testing",
      url: "https://github.com/test/repository",
      isPrivate: false,
      repository: {
        githubId: 123456,
        fullName: "test/repository",
        language: "TypeScript",
        starsCount: 100,
        forksCount: 20,
        openIssuesCount: 5,
        isFork: false,
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

    // OpenAI APIキーのモック設定
    process.env.OPENAI_API_KEY = "test-api-key"
  })

  test("複数のイベントを正常に処理できる", async () => {
    // Given: テスト用のイベントデータを作成
    const event1 = createTestEvent({
      title: "Version 1.0.0",
      body: "Initial release with new features",
      activityType: ACTIVITY_TYPE.RELEASE,
    })
    // イベントを DB に保存
    await activityRepository.upsert({
      ...event1,
      detectTargetId: toDetectTargetId(event1.dataSourceId),
    })

    // TranslationService をスタブ化
    const { TranslationAdapter } = await import(
      "../../../infra/adapters/translation/translation.adapter"
    )
    const originalTranslate = TranslationAdapter.prototype.translate
    TranslationAdapter.prototype.translate = vi.fn().mockResolvedValue({
      translatedTitle: "[翻訳済み] テストタイトル",
      translatedBody: "[翻訳済み] テスト本文",
    })

    try {
      // When: process-updates ハンドラーを実行
      const result = await handler({ activityId: event1.id }, mockContext)

      // Then: 処理結果を検証
      expect(result.processedActivityIds).toHaveLength(1)
      expect(result.failedActivityIds).toHaveLength(0)
      expect(result.processedActivityIds).toEqual(
        expect.arrayContaining([event1.id]),
      )

      // DB の状態を確認
      const updatedEvent = await activityRepository.findById(event1.id)
      expect(updatedEvent).not.toBeNull()
      expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.COMPLETED)
      expect(updatedEvent!.title).toBe("[翻訳済み] テストタイトル")
      expect(updatedEvent!.body).toBe("[翻訳済み] テスト本文")
    } finally {
      // スタブを復元
      TranslationAdapter.prototype.translate = originalTranslate
    }
  })

  test("既に処理済みのイベントはスキップされる", async () => {
    // Given: 既に完了済みのイベント
    const completedEvent = createTestEvent({
      title: "Already completed",
      body: "This is already processed",
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
    })

    // イベントを DB に保存
    await activityRepository.upsert({
      ...completedEvent,
      detectTargetId: toDetectTargetId(completedEvent.dataSourceId),
    })

    // TranslationService をスタブ化
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
      // When: 両方のイベントIDを指定してハンドラーを実行
      const result = await handler(
        { activityId: completedEvent.id },
        mockContext,
      )

      // Then: 完了済みイベントもprocessedEventIdsに含まれる（スキップされるが成功扱い）
      expect(result.processedActivityIds).toHaveLength(1)

      // 翻訳サービスは 呼び出されない
      expect(mockTranslate).toHaveBeenCalledTimes(0)
    } finally {
      // スタブを復元
      TranslationAdapter.prototype.translate = originalTranslate
    }
  })

  test("無効な入力パラメータの場合、エラーをスローする", async () => {
    // When & Then: 無効な入力でエラーをスロー
    await expect(
      handler(
        { activityId: null } as unknown as { activityId: string },
        mockContext,
      ),
    ).rejects.toThrow("Invalid input: activityId must be a string")
    await expect(
      handler({} as unknown as { activityId: string }, mockContext),
    ).rejects.toThrow("Invalid input: activityId must be a string")
  })

  test("OpenAI APIキーが設定されていない場合、エラーをスローする", async () => {
    // Given: APIキーを削除
    delete process.env.OPENAI_API_KEY

    // When & Then: APIキー未設定エラー
    await expect(
      handler({ activityId: randomUUID() }, mockContext),
    ).rejects.toThrow("Failed to get OpenAI configuration")

    // Cleanup: APIキーを復元
    process.env.OPENAI_API_KEY = "test-api-key"
  })
})
