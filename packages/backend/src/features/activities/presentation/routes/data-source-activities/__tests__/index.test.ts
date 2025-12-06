import { beforeEach, describe, expect, test, vi } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { createActivityPresentationRoutes } from "../../../routes"
import {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
} from "../../../../application/use-cases"
import type {
  RequestActivityBodyTranslationUseCase,
  GetActivityBodyTranslationStatusUseCase,
} from "../../../../application"
import { DrizzleActivityQueryRepository } from "../../../../infra"
import { globalJWTAuth } from "../../../../../identity"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import type { User } from "../../../../../identity/domain/user"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../domain"

describe("Data Source Activities API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let testUser: User
  let otherUser: User
  let testToken: string
  let otherToken: string
  let watchedDataSourceId: string
  let completedActivityId: string
  let processingActivityId: string

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|ds-activities-user")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    otherUser = await TestDataFactory.createTestUser(
      "auth0|ds-activities-other",
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
          sourceId: "octocat/api",
          name: "Octocat API",
          url: "https://github.com/octocat/api",
        },
      },
    )
    watchedDataSourceId = dataSource.id

    const completedActivity = await TestDataFactory.createTestActivity(
      watchedDataSourceId,
      {
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v2.0",
        body: "Major release",
        version: "v2.0.0",
        createdAt: new Date("2024-02-01T09:00:00Z"),
        updatedAt: new Date("2024-02-01T10:00:00Z"),
      },
    )
    completedActivityId = completedActivity.id

    await TestDataFactory.createTestNotification(
      testUser.id,
      completedActivity.id,
      {
        sentAt: new Date("2024-02-01T11:00:00Z"),
        isRead: false,
      },
    )

    const processingActivity = await TestDataFactory.createTestActivity(
      watchedDataSourceId,
      {
        activityType: ACTIVITY_TYPE.PULL_REQUEST,
        status: ACTIVITY_STATUS.PROCESSING,
        title: "Translate changelog",
        body: "Processing translation",
        version: null,
        createdAt: new Date("2024-02-02T09:00:00Z"),
        updatedAt: new Date("2024-02-02T09:30:00Z"),
      },
    )
    processingActivityId = processingActivity.id

    const otherDataSource = await TestDataFactory.createTestDataSource({
      sourceId: "someone/else",
      name: "Other Repo",
      url: "https://github.com/someone/else",
    })
    await TestDataFactory.createTestUserWatch(otherUser.id, otherDataSource.id)

    const repository = new DrizzleActivityQueryRepository()
    const listUserActivitiesUseCase = new ListUserActivitiesUseCase(repository)
    const getActivityDetailUseCase = new GetActivityDetailUseCase(repository)
    const listDataSourceActivitiesUseCase = new ListDataSourceActivitiesUseCase(
      repository,
    )
    const requestActivityBodyTranslationUseCase = {
      execute: vi
        .fn()
        .mockResolvedValue({ status: "not_found" as const }),
    } as unknown as RequestActivityBodyTranslationUseCase
    const getActivityBodyTranslationStatusUseCase = {
      execute: vi
        .fn()
        .mockResolvedValue({ status: "not_found" as const }),
    } as unknown as GetActivityBodyTranslationStatusUseCase

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

  test("GET /data-sources/{id}/activities で対象データソースのアクティビティを取得できる", async () => {
    const response = await app.request(
      `/data-sources/${watchedDataSourceId}/activities`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.dataSource.id).toBe(watchedDataSourceId)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].activity.id).toBe(completedActivityId)
  })

  test("statusクエリでprocessingアクティビティを取得できる", async () => {
    const response = await app.request(
      `/data-sources/${watchedDataSourceId}/activities?status=processing`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].activity.id).toBe(processingActivityId)
  })

  test("ウォッチしていないデータソースは404を返す", async () => {
    const response = await app.request(
      `/data-sources/${watchedDataSourceId}/activities`,
      {
        headers: AuthTestHelper.createAuthHeaders(otherToken),
      },
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe("DATA_SOURCE_NOT_FOUND")
  })

  test("無効なクエリパラメータは400を返す", async () => {
    const response = await app.request(
      `/data-sources/${watchedDataSourceId}/activities?page=0`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(400)
  })
})
