/**
 * アクティビティルートのComponent Test
 */

import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createActivityRoutes } from "../index"
import {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
} from "../../../../application/use-cases"
import { DrizzleActivityRepository } from "../../../../infra/repositories/drizzle-activity.repository"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import { globalJWTAuth } from "../../../../../identity"
import type { User } from "../../../../../identity/domain/user"
import { db } from "../../../../../../db/connection"
import {
  activities,
  dataSources,
  userWatches,
} from "../../../../../../db/schema"
import { uuidv7 } from "uuidv7"

describe("Activities API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let listUserActivitiesUseCase: ListUserActivitiesUseCase
  let getActivityDetailUseCase: GetActivityDetailUseCase
  let testUser: User
  let testToken: string
  let testDataSourceId: string
  let testActivityId: string

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|test123")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    const activityRepository = new DrizzleActivityRepository()
    listUserActivitiesUseCase = new ListUserActivitiesUseCase(
      activityRepository,
    )
    getActivityDetailUseCase = new GetActivityDetailUseCase(activityRepository)

    app = new OpenAPIHono()
    app.use("*", globalJWTAuth)
    app.route(
      "/",
      createActivityRoutes(listUserActivitiesUseCase, getActivityDetailUseCase),
    )

    // テストデータの作成
    testDataSourceId = uuidv7()
    await db.insert(dataSources).values({
      id: testDataSourceId,
      sourceType: "github_repository",
      sourceId: "facebook/react",
      name: "react",
      description: "A JavaScript library for building user interfaces",
      url: "https://github.com/facebook/react",
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ユーザーウォッチ設定の作成
    await db.insert(userWatches).values({
      id: uuidv7(),
      userId: testUser.id,
      dataSourceId: testDataSourceId,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: true,
      addedAt: new Date(),
    })

    // テストアクティビティの作成
    testActivityId = uuidv7()
    await db.insert(activities).values({
      id: testActivityId,
      dataSourceId: testDataSourceId,
      githubEventId: "github-event-1",
      activityType: "release",
      title: "React v18.0.0",
      body: "Major release with new features",
      version: "18.0.0",
      status: "completed",
      statusDetail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  describe("GET /activities", () => {
    test("認証済みユーザーによる正常なアクティビティ一覧取得", async () => {
      const res = await app.request("/", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].id).toBe(testActivityId)
      expect(body.data.items[0].title).toBe("React v18.0.0")
      expect(body.data.items[0].dataSource.name).toBe("react")
      expect(body.data.pagination).toEqual({
        currentPage: 1,
        perPage: 20,
        totalItems: 1,
        totalPages: 1,
      })
    })

    test("ページネーションの正常動作", async () => {
      // 追加のアクティビティを作成
      for (let i = 0; i < 25; i++) {
        await db.insert(activities).values({
          id: uuidv7(),
          dataSourceId: testDataSourceId,
          githubEventId: `github-event-${uuidv7()}`,
          activityType: "issue",
          title: `Issue #${i}`,
          body: `Description for issue ${i}`,
          version: null,
          status: "completed",
          statusDetail: null,
          createdAt: new Date(Date.now() + i * 1000),
          updatedAt: new Date(Date.now() + i * 1000),
        })
      }

      // 1ページ目（デフォルト20件）
      const res1 = await app.request("/?page=1&perPage=10", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res1.status).toBe(200)
      const body1 = await res1.json()
      expect(body1.data.items).toHaveLength(10)
      expect(body1.data.pagination.currentPage).toBe(1)
      expect(body1.data.pagination.perPage).toBe(10)
      expect(body1.data.pagination.totalItems).toBe(26)
      expect(body1.data.pagination.totalPages).toBe(3)

      // 2ページ目
      const res2 = await app.request("/?page=2&perPage=10", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res2.status).toBe(200)
      const body2 = await res2.json()
      expect(body2.data.items).toHaveLength(10)
      expect(body2.data.pagination.currentPage).toBe(2)
    })

    test("フィルタリングの正常動作（activityType）", async () => {
      // issue タイプのアクティビティを追加
      await db.insert(activities).values({
        id: uuidv7(),
        dataSourceId: testDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "issue",
        title: "Bug report",
        body: "Something is broken",
        version: null,
        status: "completed",
        statusDetail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request("/?activityType=release", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].activityType).toBe("release")
    })

    test("フィルタリングの正常動作（status）", async () => {
      // failed ステータスのアクティビティを追加
      await db.insert(activities).values({
        id: uuidv7(),
        dataSourceId: testDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "release",
        title: "Failed release",
        body: "This release failed",
        version: "19.0.0",
        status: "failed",
        statusDetail: "Translation failed",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request("/?status=completed", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].status).toBe("completed")
    })

    test("フィルタリングの正常動作（日付範囲）", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // 昨日のアクティビティ
      await db.insert(activities).values({
        id: uuidv7(),
        dataSourceId: testDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "release",
        title: "Old release",
        body: "Old",
        version: "1.0.0",
        status: "completed",
        statusDetail: null,
        createdAt: yesterday,
        updatedAt: yesterday,
      })

      const res = await app.request(
        `/?createdAfter=${oneHourAgo.toISOString()}&createdBefore=${tomorrow.toISOString()}`,
        {
          method: "GET",
          headers: AuthTestHelper.createAuthHeaders(testToken),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].title).toBe("React v18.0.0")
    })

    test("ソート機能の正常動作", async () => {
      const now = new Date()

      // 新しいアクティビティ
      const newActivityId = uuidv7()
      await db.insert(activities).values({
        id: newActivityId,
        dataSourceId: testDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "release",
        title: "Newer release",
        body: "Newer",
        version: "19.0.0",
        status: "completed",
        statusDetail: null,
        createdAt: new Date(now.getTime() + 10000),
        updatedAt: new Date(now.getTime() + 10000),
      })

      // 降順（デフォルト）
      const resDesc = await app.request("/?sortOrder=desc", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(resDesc.status).toBe(200)
      const bodyDesc = await resDesc.json()
      expect(bodyDesc.data.items[0].id).toBe(newActivityId)

      // 昇順
      const resAsc = await app.request("/?sortOrder=asc", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(resAsc.status).toBe(200)
      const bodyAsc = await resAsc.json()
      expect(bodyAsc.data.items[0].id).toBe(testActivityId)
    })

    test("未認証アクセスに対する401エラー", async () => {
      const res = await app.request("/", {
        method: "GET",
      })

      expect(res.status).toBe(401)
    })

    test("不正なパラメータに対するバリデーションエラー", async () => {
      const res = await app.request("/?page=invalid", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(400)
    })

    test("監視中のデータソースのアクティビティのみ取得", async () => {
      // 監視していないデータソースとアクティビティを作成
      const otherDataSourceId = uuidv7()
      await db.insert(dataSources).values({
        id: otherDataSourceId,
        sourceType: "github_repository",
        sourceId: "vuejs/vue",
        name: "vue",
        description: "Vue.js framework",
        url: "https://github.com/vuejs/vue",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.insert(activities).values({
        id: uuidv7(),
        dataSourceId: otherDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "release",
        title: "Vue v3.0.0",
        body: "Vue 3 release",
        version: "3.0.0",
        status: "completed",
        statusDetail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request("/", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      // 監視中のデータソースのアクティビティのみ（1件）
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].dataSource.name).toBe("react")
    })
  })

  describe("GET /activities/:id", () => {
    test("認証済みユーザーによる正常なアクティビティ詳細取得", async () => {
      const res = await app.request(`/${testActivityId}`, {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(testActivityId)
      expect(body.data.title).toBe("React v18.0.0")
      expect(body.data.dataSource.name).toBe("react")
      expect(body.data.dataSource.description).toBe(
        "A JavaScript library for building user interfaces",
      )
    })

    test("データソース情報が含まれることの確認", async () => {
      const res = await app.request(`/${testActivityId}`, {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.dataSource).toHaveProperty("id")
      expect(body.data.dataSource).toHaveProperty("name")
      expect(body.data.dataSource).toHaveProperty("description")
      expect(body.data.dataSource).toHaveProperty("url")
    })

    test("監視していないデータソースのアクティビティに対する404エラー", async () => {
      // 監視していないデータソースとアクティビティを作成
      const otherDataSourceId = uuidv7()
      await db.insert(dataSources).values({
        id: otherDataSourceId,
        sourceType: "github_repository",
        sourceId: "vuejs/vue",
        name: "vue",
        description: "Vue.js framework",
        url: "https://github.com/vuejs/vue",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const otherActivityId = uuidv7()
      await db.insert(activities).values({
        id: otherActivityId,
        dataSourceId: otherDataSourceId,
        githubEventId: `github-event-${uuidv7()}`,
        activityType: "release",
        title: "Vue v3.0.0",
        body: "Vue 3 release",
        version: "3.0.0",
        status: "completed",
        statusDetail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request(`/${otherActivityId}`, {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
    })

    test("存在しないアクティビティIDに対する404エラー", async () => {
      const nonExistentId = uuidv7()

      const res = await app.request(`/${nonExistentId}`, {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
    })

    test("不正なUUID形式に対するバリデーションエラー", async () => {
      const res = await app.request("/invalid-uuid", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(res.status).toBe(400)
    })

    test("未認証アクセスに対する401エラー", async () => {
      const res = await app.request(`/${testActivityId}`, {
        method: "GET",
      })

      expect(res.status).toBe(401)
    })
  })
})
