import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { createActivityTestApp } from "../../test-helpers/create-activity-test-app"
import { TranslationJobQueueStub } from "../../../../infra"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import type { User } from "../../../../../identity/domain/user"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../domain"
import { ACTIVITY_BODY_TRANSLATION_STATUS } from "shared"

describe("Activity Translation API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let testUser: User
  let otherUser: User
  let testToken: string
  let otherToken: string
  let translationTargetActivityId: string
  let inProgressActivityId: string
  let completedActivityId: string
  let queueStub: TranslationJobQueueStub

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|translation-user")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    otherUser = await TestDataFactory.createTestUser("auth0|translation-other")
    otherToken = AuthTestHelper.createTestToken(
      otherUser.auth0UserId,
      otherUser.email,
      otherUser.name,
    )

    const { dataSource } = await TestDataFactory.createCompleteDataSourceSet(
      testUser.id,
      {
        dataSource: {
          sourceId: "octocat/translation",
          name: "Translation Repo",
          url: "https://github.com/octocat/translation",
        },
      },
    )

    const translationTarget = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        activityType: ACTIVITY_TYPE.ISSUE,
        status: ACTIVITY_STATUS.PENDING,
        body: "Original body content",
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
        translatedBody: null,
      },
    )
    translationTargetActivityId = translationTarget.id

    const inProgressActivity = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.PENDING,
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
        translatedBody: null,
      },
    )
    inProgressActivityId = inProgressActivity.id

    const completedActivity = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        activityType: ACTIVITY_TYPE.PULL_REQUEST,
        status: ACTIVITY_STATUS.PENDING,
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
        translatedBody: "完了済み翻訳",
      },
    )
    completedActivityId = completedActivity.id

    queueStub = new TranslationJobQueueStub()
    app = createActivityTestApp({
      adapterOverrides: {
        translationJobQueue: queueStub,
      },
    })
  })

  test("POST /activities/{id}/translations/body で翻訳ジョブをキュー投入できる", async () => {
    const response = await app.request(
      `/activities/${translationTargetActivityId}/translations/body`,
      {
        method: "POST",
        headers: AuthTestHelper.createAuthHeaders(testToken),
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.translationStatus).toBe("queued")
    expect(queueStub.enqueued).toHaveLength(1)
    expect(queueStub.enqueued[0].activityId).toBe(translationTargetActivityId)
  })

  test("進行中ジョブがある場合は再投入せず既存ステータスを返す", async () => {
    const response = await app.request(
      `/activities/${inProgressActivityId}/translations/body`,
      {
        method: "POST",
        headers: AuthTestHelper.createAuthHeaders(testToken),
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.data.translationStatus).toBe("processing")
    expect(queueStub.enqueued).toHaveLength(0)
  })

  test("完了済み翻訳がある場合はforce=falseで200を返し、キュー投入しない", async () => {
    const response = await app.request(
      `/activities/${completedActivityId}/translations/body`,
      {
        method: "POST",
        headers: AuthTestHelper.createAuthHeaders(testToken),
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.translationStatus).toBe("completed")
    expect(queueStub.enqueued).toHaveLength(0)
  })

  test("GET /activities/{id}/translations/body で翻訳ステータスを取得できる", async () => {
    const response = await app.request(
      `/activities/${translationTargetActivityId}/translations/body`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.translationStatus).toBe("failed")
  })

  test("ウォッチしていない場合は404となる", async () => {
    const response = await app.request(
      `/activities/${translationTargetActivityId}/translations/body`,
      {
        method: "POST",
        headers: AuthTestHelper.createAuthHeaders(otherToken),
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(404)
  })

  test("認証ヘッダーが無い場合は401を返す", async () => {
    const response = await app.request(
      `/activities/${translationTargetActivityId}/translations/body`,
      {
        method: "POST",
      },
    )
    expect(response.status).toBe(401)
  })
})
