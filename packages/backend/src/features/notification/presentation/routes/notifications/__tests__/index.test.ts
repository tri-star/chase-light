import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { createNotificationPresentationRoutes } from "../../../routes"
import { globalJWTAuth } from "../../../../../identity"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import type { User } from "../../../../../identity/domain/user"
import {
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
} from "../../../../../activities/domain"
import {
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_MAX_LIMIT,
} from "../../../../constants/query.constants"

const ISO = (value: Date) => value.toISOString()

describe("Notifications API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let testUser: User
  let otherUser: User
  let testToken: string
  let otherToken: string
  let latestNotificationId: string
  let midNotificationId: string
  let olderNotificationId: string

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|notifications-user")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    otherUser = await TestDataFactory.createTestUser(
      "auth0|notifications-other",
    )
    otherToken = AuthTestHelper.createTestToken(
      otherUser.auth0UserId,
      otherUser.email,
      otherUser.name,
    )

    const primaryDataSource = await TestDataFactory.createTestDataSource({
      name: "openai/gpt",
      url: "https://github.com/openai/gpt",
    })
    const secondaryDataSource = await TestDataFactory.createTestDataSource({
      name: "openai/whisper",
      url: "https://github.com/openai/whisper",
    })

    const latestActivity = await TestDataFactory.createTestActivity(
      primaryDataSource.id,
      {
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v2.0.0",
        body: "Changelog for v2.0.0",
        summary: "v2.0.0の更新内容",
        createdAt: new Date("2025-10-25T12:00:00Z"),
        updatedAt: new Date("2025-10-25T12:10:00Z"),
      },
    )

    const secondaryActivity = await TestDataFactory.createTestActivity(
      secondaryDataSource.id,
      {
        activityType: ACTIVITY_TYPE.ISSUE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Fix login bug",
        body: "Issue details",
        summary: "【速報】ログイン不具合を修正",
        createdAt: new Date("2025-10-24T08:00:00Z"),
        updatedAt: new Date("2025-10-24T08:05:00Z"),
      },
    )

    const olderActivity = await TestDataFactory.createTestActivity(
      primaryDataSource.id,
      {
        activityType: ACTIVITY_TYPE.PULL_REQUEST,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Refactor modules",
        body: "PR details",
        summary: "モジュール構成の見直し",
        createdAt: new Date("2025-10-20T09:00:00Z"),
        updatedAt: new Date("2025-10-20T09:05:00Z"),
      },
    )

    const digestMetadata = {
      digest: {
        range: {
          from: "2025-10-24T00:00:00.000Z",
          to: "2025-10-25T00:00:00.000Z",
          timezone: "Asia/Tokyo",
        },
        activityCount: 1,
      },
    }

    const latestNotification = await TestDataFactory.createDigestNotification(
      testUser.id,
      {
        scheduledAt: new Date("2025-10-25T13:00:00Z"),
        metadata: digestMetadata,
        entries: [
          {
            dataSourceId: primaryDataSource.id,
            dataSourceName: primaryDataSource.name,
            activityId: latestActivity.id,
            activityType: ACTIVITY_TYPE.RELEASE,
            title: "Release v2.0.0",
            summary: "AIモデルを刷新しました",
            url: "https://github.com/openai/gpt/releases/tag/v2.0.0",
          },
        ],
      },
    )
    latestNotificationId = latestNotification.notificationId

    const olderNotification = await TestDataFactory.createDigestNotification(
      testUser.id,
      {
        isRead: true,
        scheduledAt: new Date("2025-10-21T00:00:00Z"),
        metadata: digestMetadata,
        entries: [
          {
            dataSourceId: primaryDataSource.id,
            dataSourceName: primaryDataSource.name,
            activityId: olderActivity.id,
            activityType: ACTIVITY_TYPE.PULL_REQUEST,
            title: "Refactor modules",
            summary: "コードベースを整理しました",
            url: "https://github.com/openai/gpt/pull/42",
          },
        ],
      },
    )
    olderNotificationId = olderNotification.notificationId

    const midNotification = await TestDataFactory.createDigestNotification(
      testUser.id,
      {
        scheduledAt: new Date("2025-10-24T10:00:00Z"),
        metadata: digestMetadata,
        entries: [
          {
            dataSourceId: secondaryDataSource.id,
            dataSourceName: secondaryDataSource.name,
            activityId: secondaryActivity.id,
            activityType: ACTIVITY_TYPE.ISSUE,
            title: "Fix login bug",
            summary: "ログイン不具合を速報で修正",
            url: "https://github.com/openai/whisper/issues/101",
          },
        ],
      },
    )
    midNotificationId = midNotification.notificationId

    await TestDataFactory.createDigestNotification(otherUser.id, {
      scheduledAt: new Date("2025-10-24T10:00:00Z"),
      metadata: digestMetadata,
      entries: [
        {
          dataSourceId: primaryDataSource.id,
          dataSourceName: primaryDataSource.name,
          activityId: olderActivity.id,
          activityType: ACTIVITY_TYPE.PULL_REQUEST,
          title: "Other user notification",
          summary: "別ユーザー向け",
        },
      ],
    })

    app = new OpenAPIHono()
    app.use("*", globalJWTAuth)
    app.route("/", createNotificationPresentationRoutes())
  })

  test("GET /notifications で最新の通知が先頭に並ぶ", async () => {
    const response = await app.request("/notifications", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(3)
    expect(body.data.pageInfo.hasNext).toBe(false)
    expect(body.data.items[0].notification.id).toBe(latestNotificationId)
    expect(
      body.data.items[0].dataSources[0].groups[0].entries[0].occurredAt,
    ).toBe(ISO(new Date("2025-10-25T12:00:00Z")))
  })

  test("GET /notifications?read=unread で未読のみ取得できる", async () => {
    const response = await app.request("/notifications?read=unread", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    type NotificationResponseItem = { notification: { isRead: boolean } }
    const items = body.data.items as NotificationResponseItem[]

    for (const item of items) {
      expect(item.notification.isRead).toBe(false)
    }
  })

  test("GET /notifications?search=ログイン で該当通知のみが返る", async () => {
    const response = await app.request(
      "/notifications?search=" + encodeURIComponent("ログイン"),
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.data.items).toHaveLength(1)
    expect(
      body.data.items[0].dataSources[0].groups[0].entries[0].summary,
    ).toContain("ログイン")
  })

  test("カーソルを使って次ページを取得できる", async () => {
    const firstResponse = await app.request("/notifications?limit=1", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(firstResponse.status).toBe(200)
    const firstBody = await firstResponse.json()

    expect(firstBody.data.items).toHaveLength(1)
    expect(firstBody.data.pageInfo.hasNext).toBe(true)
    const cursor = firstBody.data.pageInfo.nextCursor
    expect(cursor).toBeDefined()

    const secondResponse = await app.request(
      `/notifications?limit=1&cursor=${encodeURIComponent(cursor)}`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(secondResponse.status).toBe(200)
    const secondBody = await secondResponse.json()

    expect(secondBody.data.items).toHaveLength(1)
    expect(secondBody.data.items[0].notification.id).toBe(midNotificationId)
    expect(secondBody.data.pageInfo.hasNext).toBe(true)

    const nextCursor = secondBody.data.pageInfo.nextCursor
    expect(nextCursor).toBeDefined()

    const thirdResponse = await app.request(
      `/notifications?limit=1&cursor=${encodeURIComponent(nextCursor)}`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(thirdResponse.status).toBe(200)
    const thirdBody = await thirdResponse.json()

    expect(thirdBody.data.items).toHaveLength(1)
    expect(thirdBody.data.items[0].notification.id).toBe(olderNotificationId)
    expect(thirdBody.data.pageInfo.hasNext).toBe(false)
  })

  test("不正なカーソル指定は400を返す", async () => {
    const response = await app.request("/notifications?cursor=invalid", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe(NOTIFICATIONS_ERROR.INVALID_CURSOR)
  })

  test("limitが許可上限を超える場合は422を返す", async () => {
    const response = await app.request(
      `/notifications?limit=${NOTIFICATIONS_MAX_LIMIT + 1}`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.error.code).toBe("NOTIFICATIONS_LIMIT_TOO_LARGE")
  })

  test("GET /notifications/{id} で詳細情報を取得できる", async () => {
    const response = await app.request(
      `/notifications/${latestNotificationId}`,
      {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.data.item.notification.id).toBe(latestNotificationId)
    expect(body.data.item.dataSources[0].groups[0].entries).toHaveLength(1)
  })

  test("別ユーザーの通知IDは404を返す", async () => {
    const response = await app.request(
      `/notifications/${latestNotificationId}`,
      {
        headers: AuthTestHelper.createAuthHeaders(otherToken),
      },
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe("NOTIFICATION_NOT_FOUND")
  })

  test("認証ヘッダーが無い場合は401を返す", async () => {
    const response = await app.request("/notifications")
    expect(response.status).toBe(401)
  })
})
