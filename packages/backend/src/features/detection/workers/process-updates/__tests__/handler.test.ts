import { describe, test, beforeEach, afterEach, expect, vi } from "vitest"
import type { SQSEvent, Context } from "aws-lambda"
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
import {
  createTranslationPort,
  resetTranslationPort,
} from "../../../infra/adapters/translation/translation-port.factory"
import { TranslationAdapterStub } from "../../../infra/adapters/translation/translation-stub.adapter"

describe("process-updates handler", () => {
  setupComponentTest()

  let activityRepository: DrizzleActivityRepository
  let mockContext: Context
  let testDataSourceId: string
  const originalStubEnv = process.env.USE_EXTERNAL_AI_API_STUB

  const createSQSEvent = (payload: { activityId: string }): SQSEvent => ({
    Records: [
      {
        messageId: "test-message-id",
        receiptHandle: "test-receipt-handle",
        body: JSON.stringify(payload),
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: Date.now().toString(),
          SenderId: "local",
          ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:local:000000000000:test-queue",
        awsRegion: "us-east-1",
      },
    ],
  })

  const createTestEvent = (overrides: Partial<Activity> = {}): Activity => {
    const defaultEvent: Activity = {
      id: randomUUID(),
      dataSourceId: testDataSourceId,
      githubEventId: `test-event-${randomUUID()}`,
      activityType: ACTIVITY_TYPE.RELEASE,
      title: "Test Event",
      body: "Test event body",
      translatedTitle: null,
      summary: null,
      translatedBody: null,
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
    process.env.USE_EXTERNAL_AI_API_STUB = "true"
    resetTranslationPort()

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

  afterEach(() => {
    resetTranslationPort()
    if (originalStubEnv === undefined) {
      delete process.env.USE_EXTERNAL_AI_API_STUB
    } else {
      process.env.USE_EXTERNAL_AI_API_STUB = originalStubEnv
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

    const translationPort = await createTranslationPort()
    if (!(translationPort instanceof TranslationAdapterStub)) {
      throw new Error("TranslationAdapterStub is required for this test")
    }
    translationPort.configure(async () => ({
      translatedTitle: "[翻訳済み] テストタイトル",
      summary: "[要約] テスト本文の要約",
      translatedBody: null,
    }))

    const sqsEvent = createSQSEvent({ activityId: event1.id })
    const result = await handler(sqsEvent, mockContext)

    expect(result.batchItemFailures).toHaveLength(0)

    const updatedEvent = await activityRepository.findById(event1.id)
    expect(updatedEvent).not.toBeNull()
    expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.COMPLETED)
    expect(updatedEvent!.title).toBe("Version 1.0.0")
    expect(updatedEvent!.body).toBe("Initial release with new features")
    expect(updatedEvent!.translatedTitle).toBe("[翻訳済み] テストタイトル")
    expect(updatedEvent!.summary).toBe("[要約] テスト本文の要約")
    expect(updatedEvent!.translatedBody).toBeNull()
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

    const translationPort = await createTranslationPort()
    if (!(translationPort instanceof TranslationAdapterStub)) {
      throw new Error("TranslationAdapterStub is required for this test")
    }

    let callCount = 0
    translationPort.configure(async ({ title }) => {
      callCount += 1
      return {
        translatedTitle: `unused ${title}`,
        summary: `unused ${title}`,
        translatedBody: null,
      }
    })

    const sqsEvent = createSQSEvent({ activityId: completedEvent.id })
    const result = await handler(sqsEvent, mockContext)

    expect(result.batchItemFailures).toHaveLength(0)
    expect(callCount).toBe(0)
  })

  test("翻訳アダプタでエラーが発生した場合は失敗として記録される", async () => {
    const event = createTestEvent()

    await activityRepository.upsert({
      ...event,
      detectTargetId: toDetectTargetId(event.dataSourceId),
    })

    const translationPort = await createTranslationPort()
    if (!(translationPort instanceof TranslationAdapterStub)) {
      throw new Error("TranslationAdapterStub is required for this test")
    }
    translationPort.configure(() => {
      throw new Error("translation failed")
    })

    const sqsEvent = createSQSEvent({ activityId: event.id })
    const result = await handler(sqsEvent, mockContext)

    expect(result.batchItemFailures).toHaveLength(1)
    expect(result.batchItemFailures[0].itemIdentifier).toBe("test-message-id")

    const updatedEvent = await activityRepository.findById(event.id)
    expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.FAILED)
    expect(updatedEvent!.statusDetail).toContain("translation failed")
  })

  test("無効な入力パラメータの場合、正常終了してスキップする", async () => {
    const invalidSQSEvent1 = createSQSEvent({ activityId: null } as unknown as {
      activityId: string
    })
    const result1 = await handler(invalidSQSEvent1, mockContext)
    expect(result1.batchItemFailures).toHaveLength(0)

    const invalidSQSEvent2 = createSQSEvent(
      {} as unknown as { activityId: string },
    )
    const result2 = await handler(invalidSQSEvent2, mockContext)
    expect(result2.batchItemFailures).toHaveLength(0)
  })

  test("OpenAI APIキーが設定されていない場合でもフォールバックで処理される", async () => {
    delete process.env.OPENAI_API_KEY
    process.env.USE_EXTERNAL_AI_API_STUB = "false"
    resetTranslationPort()

    const event = createTestEvent()

    await activityRepository.upsert({
      ...event,
      detectTargetId: toDetectTargetId(event.dataSourceId),
    })

    const sqsEvent = createSQSEvent({ activityId: event.id })
    const result = await handler(sqsEvent, mockContext)

    expect(result.batchItemFailures).toHaveLength(0)

    const updatedEvent = await activityRepository.findById(event.id)
    expect(updatedEvent!.status).toBe(ACTIVITY_STATUS.COMPLETED)
    expect(updatedEvent!.translatedTitle).toBeNull()
    expect(updatedEvent!.summary).toBeNull()
    expect(updatedEvent!.translatedBody).toBeNull()
  })
})
