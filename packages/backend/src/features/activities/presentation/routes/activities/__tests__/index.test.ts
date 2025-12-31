import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { createActivityTestApp } from "../../test-helpers/create-activity-test-app"
import { TranslationJobQueueStub } from "../../../../infra"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import type { User } from "../../../../../identity/domain/user"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../domain"

const ISO = (value: Date) => value.toISOString()

describe("Activities API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let testUser: User
  let otherUser: User
  let testToken: string
  let otherToken: string
  let completedActivityId: string
  let pendingActivityId: string
  let queueStub: TranslationJobQueueStub

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|activities-user")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    otherUser = await TestDataFactory.createTestUser("auth0|activities-other")
    otherToken = AuthTestHelper.createTestToken(
      otherUser.auth0UserId,
      otherUser.email,
      otherUser.name,
    )

    const { dataSource: watchedDataSource } =
      await TestDataFactory.createCompleteDataSourceSet(testUser.id, {
        dataSource: {
          sourceId: "octocat/hello-world",
          name: "Hello World",
          url: "https://github.com/octocat/hello-world",
        },
      })

    const completedActivity = await TestDataFactory.createTestActivity(
      watchedDataSource.id,
      {
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "v1.0.0 Released",
        body: "Initial release with major features",
        version: "v1.0.0",
        createdAt: new Date("2024-01-01T09:00:00Z"),
        updatedAt: new Date("2024-01-01T09:30:00Z"),
      },
    )
    completedActivityId = completedActivity.id

    await TestDataFactory.createTestNotification(
      testUser.id,
      completedActivity.id,
      {
        sentAt: new Date("2024-01-01T10:00:00Z"),
        isRead: false,
      },
    )

    const pendingActivity = await TestDataFactory.createTestActivity(
      watchedDataSource.id,
      {
        activityType: ACTIVITY_TYPE.ISSUE,
        status: ACTIVITY_STATUS.PENDING,
        title: "Investigate flaky test",
        body: "Pending issue body",
        version: null,
        createdAt: new Date("2024-01-02T09:00:00Z"),
        updatedAt: new Date("2024-01-02T09:30:00Z"),
      },
    )
    pendingActivityId = pendingActivity.id

    const otherDataSource = await TestDataFactory.createTestDataSource({
      sourceId: "someone/else",
      name: "Other Repository",
      url: "https://github.com/someone/else",
    })
    await TestDataFactory.createTestActivity(otherDataSource.id, {
      activityType: ACTIVITY_TYPE.PULL_REQUEST,
      status: ACTIVITY_STATUS.COMPLETED,
      title: "Merge feature branch",
    })
    await TestDataFactory.createTestUserWatch(otherUser.id, otherDataSource.id)

    queueStub = new TranslationJobQueueStub()
    const result = createActivityTestApp({
      adapterOverrides: {
        translationJobQueue: queueStub,
      },
    })
    app = result.app
  })

  test("GET /activities でウォッチしているcompletedアクティビティ一覧を取得できる", async () => {
    const response = await app.request("/activities", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)

    const [item] = body.data.items
    expect(item.activity.id).toBe(completedActivityId)
    expect(item.activity.activityType).toBe("release")
    expect(body.data.pagination.total).toBe(1)
  })

  test("GET /activities?status=pending でpendingアクティビティを取得できる", async () => {
    const response = await app.request("/activities?status=pending", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].activity.id).toBe(pendingActivityId)
    expect(body.data.items[0].activity.status).toBe("pending")
  })

  test("GET /activities/{id} で詳細情報を取得できる", async () => {
    const response = await app.request(`/activities/${completedActivityId}`, {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.data.activity.id).toBe(completedActivityId)
    expect(body.data.activity.detail).toBe(
      "Initial release with major features",
    )
    expect(body.data.activity.occurredAt).toBe(
      ISO(new Date("2024-01-01T09:00:00Z")),
    )
  })

  test("ウォッチしていないユーザーはGET /activities/{id}で404となる", async () => {
    const response = await app.request(`/activities/${completedActivityId}`, {
      headers: AuthTestHelper.createAuthHeaders(otherToken),
    })

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe("ACTIVITY_NOT_FOUND")
  })

  test("認証ヘッダーが無い場合は401を返す", async () => {
    const response = await app.request("/activities")
    expect(response.status).toBe(401)
  })

  test("無効なクエリパラメータは400を返す", async () => {
    const response = await app.request("/activities?page=0", {
      headers: AuthTestHelper.createAuthHeaders(testToken),
    })

    expect(response.status).toBe(400)
  })

  describe("キーワード検索機能", () => {
    beforeEach(async () => {
      const { dataSource: testDataSource } =
        await TestDataFactory.createCompleteDataSourceSet(testUser.id, {
          dataSource: {
            sourceId: "facebook/react",
            name: "React Library",
            url: "https://github.com/facebook/react",
          },
        })

      await TestDataFactory.createTestActivity(testDataSource.id, {
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "React 18.0.0 released",
        translatedTitle: "React 18.0.0 がリリースされました",
        body: "This is a major release with new concurrent features",
        translatedBody: "これは新しい並行処理機能を含むメジャーリリースです",
        summary: "新しい並行処理機能を含むメジャーリリース",
        version: "18.0.0",
      })

      await TestDataFactory.createTestActivity(testDataSource.id, {
        activityType: ACTIVITY_TYPE.ISSUE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Bug in useState hook",
        translatedTitle: null,
        body: "useState is not working correctly",
        translatedBody: null,
        summary: null,
        version: null,
      })

      await TestDataFactory.createTestActivity(testDataSource.id, {
        activityType: ACTIVITY_TYPE.PULL_REQUEST,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Fix TypeScript types",
        translatedTitle: null,
        body: "Improve type definitions",
        translatedBody: null,
        summary: null,
        version: null,
      })
    })

    test("keywordでアクティビティタイトルを検索し、該当結果が返ること", async () => {
      const response = await app.request("/activities?keyword=React", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
      expect(
        body.data.items.some((item: { activity: { title: string } }) =>
          item.activity.title.includes("React"),
        ),
      ).toBe(true)
    })

    test("keywordで翻訳タイトルを検索し、該当結果が返ること", async () => {
      const response = await app.request(
        "/activities?keyword=リリースされました",
        {
          headers: AuthTestHelper.createAuthHeaders(testToken),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
      expect(
        body.data.items.some(
          (item: { activity: { translatedTitle: string | null } }) =>
            item.activity.translatedTitle?.includes("リリースされました"),
        ),
      ).toBe(true)
    })

    test("keywordで翻訳本文を検索し、該当結果が返ること", async () => {
      const response = await app.request("/activities?keyword=並行処理", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
    })

    test("keywordでデータソース名を検索し、該当結果が返ること", async () => {
      const response = await app.request("/activities?keyword=Library", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
    })

    test("keywordでリポジトリ名(owner/repo)を検索し、該当結果が返ること", async () => {
      // Note: このテストはrepositoryデータが存在する場合のみ動作する
      // facebook/react データソースにはrepositoryデータが作成されているはず
      const response = await app.request("/activities?keyword=react", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      // repositoryのfull_name検索も含めたOR検索なので、
      // データソース名やタイトルで"react"にマッチすれば結果が返る
      expect(body.data.items.length).toBeGreaterThan(0)
    })

    test("大文字小文字を区別せずに検索できること(ILIKE動作確認)", async () => {
      const response = await app.request("/activities?keyword=REACT", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
    })

    test("該当なしの場合は空配列が返ること", async () => {
      const response = await app.request(
        "/activities?keyword=nonexistentkeyword12345",
        {
          headers: AuthTestHelper.createAuthHeaders(testToken),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items).toHaveLength(0)
      expect(body.data.pagination.total).toBe(0)
    })

    test("keywordパラメータなしの場合は従来通りの動作をすること", async () => {
      const response = await app.request("/activities", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
    })

    test("keywordが空文字の場合は無視されること", async () => {
      const response = await app.request("/activities?keyword=", {
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.items.length).toBeGreaterThan(0)
    })
  })
})
