import { describe, expect, test, beforeEach, afterEach } from "vitest"
import type { Context } from "aws-lambda"
import { handler } from "../handler"
import { setupComponentTest, TestDataFactory } from "../../../../../test"
import { DrizzleActivityRepository } from "../../../infra"
import {
  ActivityBodyTranslationAdapterStub,
  createActivityBodyTranslationPort,
  resetActivityBodyTranslationPort,
} from "../../../infra/adapters/translation/translation-port.factory"
import { ACTIVITY_BODY_TRANSLATION_STATUS } from "../../../domain"

describe("translate-activity-body handler", () => {
  setupComponentTest()

  let activityRepository: DrizzleActivityRepository
  let mockContext: Context
  let testActivityId: string

  beforeEach(async () => {
    process.env.USE_EXTERNAL_AI_API_STUB = "true"
    resetActivityBodyTranslationPort()

    const dataSource = await TestDataFactory.createTestDataSource({
      sourceId: "octocat/hello-world",
      name: "Hello World",
    })
    activityRepository = new DrizzleActivityRepository()

    const activity = await TestDataFactory.createTestActivity(dataSource.id, {
      activityType: "release",
      body: "Release body content",
      status: "completed",
    })
    await activityRepository.updateBodyTranslationState(activity.id, {
      status: ACTIVITY_BODY_TRANSLATION_STATUS.PENDING,
    })
    testActivityId = activity.id

    mockContext = {
      awsRequestId: "test-request-id",
      logGroupName: "test-log-group",
      logStreamName: "test-log-stream",
      functionName: "translate-activity-body",
      functionVersion: "1",
      invokedFunctionArn:
        "arn:aws:lambda:us-east-1:123456789012:function:translate-activity-body",
      memoryLimitInMB: "128",
      getRemainingTimeInMillis: () => 30000,
      callbackWaitsForEmptyEventLoop: true,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    }
  })

  afterEach(() => {
    resetActivityBodyTranslationPort()
  })

  test("pendingをprocessing→completedに更新し、本文翻訳結果を保存する", async () => {
    const port = await createActivityBodyTranslationPort()
    if (port instanceof ActivityBodyTranslationAdapterStub) {
      port.configure(async () => ({
        translatedTitle: "[ja] Title",
        summary: "[ja] summary",
        translatedBody: "[ja] translated body",
      }))
    }

    const result = await handler({ activityId: testActivityId }, mockContext)

    expect(result.status).toBe("completed")
    const updated = await activityRepository.findById(testActivityId)
    expect(updated?.bodyTranslationStatus).toBe(
      ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
    )
    expect(updated?.translatedBody).toBe("[ja] translated body")
  })

  test("pending以外はスキップされる", async () => {
    await activityRepository.updateBodyTranslationState(testActivityId, {
      status: ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
    })

    const result = await handler({ activityId: testActivityId }, mockContext)
    expect(result.status).toBe("skipped")
  })

  test("翻訳失敗時はfailedに遷移する", async () => {
    const port = await createActivityBodyTranslationPort()
    if (port instanceof ActivityBodyTranslationAdapterStub) {
      port.configure(() => {
        throw new Error("translation failed")
      })
    }

    const result = await handler({ activityId: testActivityId }, mockContext)

    expect(result.status).toBe("failed")
    const updated = await activityRepository.findById(testActivityId)
    expect(updated?.bodyTranslationStatus).toBe(
      ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
    )
    expect(updated?.bodyTranslationError).toContain("translation failed")
  })
})
