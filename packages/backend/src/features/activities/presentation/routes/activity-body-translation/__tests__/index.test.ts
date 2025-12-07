import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { createActivityPresentationRoutes } from "../../../routes"
import {
  GetActivityBodyTranslationStatusUseCase,
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
  RequestActivityBodyTranslationUseCase,
} from "../../../../application/use-cases"
import {
  DrizzleActivityQueryRepository,
  DrizzleActivityRepository,
} from "../../../../infra"
import { globalJWTAuth } from "../../../../../identity"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  ACTIVITY_STATUS,
} from "../../../../domain"

describe("Activity Body Translation API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let testToken: string
  let otherToken: string
  let translationActivityId: string
  let processingActivityId: string
  let completedActivityId: string
  let dataSourceName: string
  let repositoryFullName: string

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    const testUser = await TestDataFactory.createTestUser(
      "auth0|activity-translation-user",
    )
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    const otherUser = await TestDataFactory.createTestUser(
      "auth0|activity-translation-other",
    )
    otherToken = AuthTestHelper.createTestToken(
      otherUser.auth0UserId,
      otherUser.email,
      otherUser.name,
    )

    const { dataSource } = await TestDataFactory.createCompleteDataSourceSet(
      testUser.id,
      {
        dataSource: {
          name: "Translation Target Repo",
          url: "https://github.com/octocat/translation-target",
          repository: {
            fullName: "octocat/translation-target",
            language: "TypeScript",
            starsCount: 42,
            forksCount: 7,
            openIssuesCount: 1,
          },
        },
      },
    )
    dataSourceName = dataSource.name
    repositoryFullName = dataSource.repository.fullName

    const activityRepository = new DrizzleActivityRepository()

    const translationActivity = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        title: "Translate this activity",
        body: "Original body to translate",
        status: ACTIVITY_STATUS.COMPLETED,
      },
    )
    translationActivityId = translationActivity.id

    const processingActivity = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        title: "Already processing translation",
        status: ACTIVITY_STATUS.PROCESSING,
      },
    )
    processingActivityId = processingActivity.id
    await activityRepository.updateBodyTranslationState(processingActivityId, {
      status: ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
      requestedAt: new Date("2024-04-02T00:00:00Z"),
    })

    const completedActivity = await TestDataFactory.createTestActivity(
      dataSource.id,
      {
        title: "Translated activity",
        status: ACTIVITY_STATUS.COMPLETED,
      },
    )
    completedActivityId = completedActivity.id
    await activityRepository.updateBodyTranslationState(completedActivityId, {
      status: ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
      requestedAt: new Date("2024-04-01T00:00:00Z"),
      startedAt: new Date("2024-04-01T00:05:00Z"),
      completedAt: new Date("2024-04-01T00:10:00Z"),
      translatedBody: "[ja] translated body",
    })

    const activityQueryRepository = new DrizzleActivityQueryRepository()
    const listUserActivitiesUseCase = new ListUserActivitiesUseCase(
      activityQueryRepository,
    )
    const getActivityDetailUseCase = new GetActivityDetailUseCase(
      activityQueryRepository,
    )
    const listDataSourceActivitiesUseCase = new ListDataSourceActivitiesUseCase(
      activityQueryRepository,
    )
    const requestActivityBodyTranslationUseCase =
      new RequestActivityBodyTranslationUseCase(activityRepository)
    const getActivityBodyTranslationStatusUseCase =
      new GetActivityBodyTranslationStatusUseCase(activityRepository)

    app = new OpenAPIHono()
    app.use("*", globalJWTAuth)
    app.route(
      "/",
      createActivityPresentationRoutes(
        listUserActivitiesUseCase,
        getActivityDetailUseCase,
        listDataSourceActivitiesUseCase,
        requestActivityBodyTranslationUseCase,
        getActivityBodyTranslationStatusUseCase,
      ),
    )
  })

  test("POST /activities/{id}/translation/body で本文翻訳をリクエストできる", async () => {
    const response = await app.request(
      `/activities/${translationActivityId}/translation/body`,
      {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.activity.bodyTranslationStatus).toBe("pending")
    expect(body.data.activity.bodyTranslationRequestedAt).toBeTruthy()
    expect(body.data.activity.source.name).toBe(dataSourceName)
    expect(body.data.activity.source.metadata.repositoryFullName).toBe(
      repositoryFullName,
    )
  })

  test("force=true で完了済みの翻訳を再リクエストできる", async () => {
    const response = await app.request(
      `/activities/${completedActivityId}/translation/body`,
      {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ force: true }),
      },
    )

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.data.activity.bodyTranslationStatus).toBe("pending")
    expect(body.data.activity.bodyTranslationRequestedAt).toBeTruthy()
    expect(body.data.activity.translatedBody).toBe("[ja] translated body")
  })

  test("processing中はforceなしで409を返す", async () => {
    const response = await app.request(
      `/activities/${processingActivityId}/translation/body`,
      {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error.code).toBe("BODY_TRANSLATION_IN_PROGRESS")
  })

  test("GET /activities/{id}/translation/body/status で進行状況を取得できる", async () => {
    const response = await app.request(
      `/activities/${translationActivityId}/translation/body/status`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.activity.bodyTranslationStatus).toBe("not_requested")
    expect(body.data.activity.source.metadata.repositoryFullName).toBe(
      repositoryFullName,
    )
  })

  test("ウォッチしていないユーザーは404を返す", async () => {
    const response = await app.request(
      `/activities/${translationActivityId}/translation/body/status`,
      {
        headers: AuthTestHelper.createAuthHeaders(otherToken),
      },
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe("ACTIVITY_NOT_FOUND")
  })
})
