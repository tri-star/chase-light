import { beforeEach, describe, expect, test } from "vitest"
import type { Context } from "aws-lambda"
import { handler } from "../handler"
import { setupComponentTest, TestDataFactory } from "../../../../../test"
import { ACTIVITY_BODY_TRANSLATION_STATUS } from "shared"
import { TransactionManager } from "../../../../../core/db"
import { eq } from "drizzle-orm"
import { activities } from "../../../../../db/schema"

describe("translate-activity-body handler", () => {
  setupComponentTest()

  let mockContext: Context
  let activityId: string

  beforeEach(async () => {
    mockContext = {
      awsRequestId: "test-request-id",
      callbackWaitsForEmptyEventLoop: true,
      done: () => undefined,
      fail: () => undefined,
      succeed: () => undefined,
      functionName: "translate-activity-body",
      functionVersion: "1",
      invokedFunctionArn: "arn:aws:lambda:local:test",
      logGroupName: "/aws/lambda/translate-activity-body",
      logStreamName: "test",
      memoryLimitInMB: "128",
      getRemainingTimeInMillis: () => 30000,
    }

    const user = await TestDataFactory.createTestUser(
      "auth0|translation-worker",
    )
    const { dataSource } = await TestDataFactory.createCompleteDataSourceSet(
      user.id,
    )
    const activity = await TestDataFactory.createTestActivity(dataSource.id, {
      body: "Original body content",
      translatedBody: null,
      bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED,
    })
    activityId = activity.id

    process.env.USE_TRANSLATION_STUB = "true"
    process.env.OPENAI_API_KEY = ""
  })

  test("本文翻訳ジョブを処理し、完了ステータスになる", async () => {
    const result = await handler({ activityId }, mockContext)

    expect(result.translationStatus).toBe("completed")

    const connection = await TransactionManager.getConnection()
    const updated = await connection.query.activities.findFirst({
      columns: {
        translatedBody: true,
        bodyTranslationStatus: true,
      },
      where: eq(activities.id, activityId),
    })

    expect(updated?.bodyTranslationStatus).toBe("completed")
    expect(updated?.translatedBody).toContain("[translated]")
  })

  test("存在しないアクティビティの場合はtranslationStatusがnull", async () => {
    const result = await handler(
      { activityId: "00000000-0000-0000-0000-000000000000" },
      mockContext,
    )

    expect(result.translationStatus).toBeNull()
  })
})
