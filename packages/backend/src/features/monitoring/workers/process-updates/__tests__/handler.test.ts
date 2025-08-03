import { describe, test, beforeEach, expect, vi } from "vitest"
import type { Context } from "aws-lambda"
import { handler } from "../handler"
import { setupComponentTest } from "../../../../../test"
import { EventRepository } from "../../../repositories"
import { DataSourceRepository } from "../../../../data-sources/repositories/data-source.repository"
import { EVENT_STATUS, EVENT_TYPE, type Event } from "../../../domain/event"
import { DATA_SOURCE_TYPES } from "../../../../data-sources/domain/data-source"
import { randomUUID } from "crypto"

describe("process-updates handler", () => {
  setupComponentTest()

  let eventRepository: EventRepository
  let dataSourceRepository: DataSourceRepository
  let mockContext: Context
  let testDataSourceId: string

  // テストイベントデータファクトリ関数
  const createTestEvent = (overrides: Partial<Event> = {}): Event => {
    const defaultEvent: Event = {
      id: randomUUID(),
      dataSourceId: testDataSourceId,
      githubEventId: `test-event-${randomUUID()}`,
      eventType: EVENT_TYPE.RELEASE,
      title: "Test Event",
      body: "Test event body",
      version: "v1.0.0",
      status: EVENT_STATUS.PENDING,
      statusDetail: null,
      githubData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return { ...defaultEvent, ...overrides }
  }

  beforeEach(async () => {
    eventRepository = new EventRepository()
    dataSourceRepository = new DataSourceRepository()

    // テスト用データソースを作成
    const testDataSource = await dataSourceRepository.save({
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: "test/repository",
      name: "Test Repository",
      description: "Test repository for testing",
      url: "https://github.com/test/repository",
      isPrivate: false,
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
      eventType: EVENT_TYPE.RELEASE,
    })
    // イベントを DB に保存
    await eventRepository.upsert(event1)

    // TranslationService をスタブ化
    const { TranslationService } = await import(
      "../../../services/translation.service"
    )
    const originalTranslate = TranslationService.prototype.translate
    TranslationService.prototype.translate = vi.fn().mockResolvedValue({
      translatedTitle: "[翻訳済み] テストタイトル",
      translatedBody: "[翻訳済み] テスト本文",
    })

    try {
      // When: process-updates ハンドラーを実行
      const result = await handler({ eventId: event1.id }, mockContext)

      // Then: 処理結果を検証
      expect(result.processedEventIds).toHaveLength(1)
      expect(result.failedEventIds).toHaveLength(0)
      expect(result.processedEventIds).toEqual(
        expect.arrayContaining([event1.id]),
      )

      // DB の状態を確認
      const updatedEvent = await eventRepository.findById(event1.id)
      expect(updatedEvent).not.toBeNull()
      expect(updatedEvent!.status).toBe(EVENT_STATUS.COMPLETED)
      expect(updatedEvent!.title).toBe("[翻訳済み] テストタイトル")
      expect(updatedEvent!.body).toBe("[翻訳済み] テスト本文")
    } finally {
      // スタブを復元
      TranslationService.prototype.translate = originalTranslate
    }
  })

  test("既に処理済みのイベントはスキップされる", async () => {
    // Given: 既に完了済みのイベント
    const completedEvent = createTestEvent({
      title: "Already completed",
      body: "This is already processed",
      eventType: EVENT_TYPE.RELEASE,
      status: EVENT_STATUS.COMPLETED,
    })

    // イベントを DB に保存
    await eventRepository.upsert(completedEvent)

    // TranslationService をスタブ化
    const { TranslationService } = await import(
      "../../../services/translation.service"
    )
    const originalTranslate = TranslationService.prototype.translate
    const mockTranslate = vi.fn().mockResolvedValue({
      translatedTitle: "[翻訳済み] テストタイトル",
      translatedBody: "[翻訳済み] テスト本文",
    })
    TranslationService.prototype.translate = mockTranslate

    try {
      // When: 両方のイベントIDを指定してハンドラーを実行
      const result = await handler({ eventId: completedEvent.id }, mockContext)

      // Then: 完了済みイベントもprocessedEventIdsに含まれる（スキップされるが成功扱い）
      expect(result.processedEventIds).toHaveLength(1)

      // 翻訳サービスは 呼び出されない
      expect(mockTranslate).toHaveBeenCalledTimes(0)
    } finally {
      // スタブを復元
      TranslationService.prototype.translate = originalTranslate
    }
  })

  test("無効な入力パラメータの場合、エラーをスローする", async () => {
    // When & Then: 無効な入力でエラーをスロー
    await expect(
      handler({ eventId: null } as unknown as { eventId: string }, mockContext),
    ).rejects.toThrow("Invalid input: eventId must be a string")
    await expect(
      handler({} as unknown as { eventId: string }, mockContext),
    ).rejects.toThrow("Invalid input: eventId must be a string")
  })

  test("OpenAI APIキーが設定されていない場合、エラーをスローする", async () => {
    // Given: APIキーを削除
    delete process.env.OPENAI_API_KEY

    // When & Then: APIキー未設定エラー
    await expect(
      handler({ eventId: randomUUID() }, mockContext),
    ).rejects.toThrow("Failed to get OpenAI configuration")

    // Cleanup: APIキーを復元
    process.env.OPENAI_API_KEY = "test-api-key"
  })
})
