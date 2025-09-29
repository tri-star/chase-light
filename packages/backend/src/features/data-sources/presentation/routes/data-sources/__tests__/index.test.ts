import { beforeEach, describe, expect, test } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { eq } from "drizzle-orm"
import { createDataSourceRoutes } from "../index"
import {
  RegisterDataSourceWatchUseCase,
  ListDataSourcesUseCase,
  GetDataSourceUseCase,
  UpdateDataSourceUseCase,
  RemoveDataSourceWatchUseCase,
} from "../../../../application/use-cases"
import {
  DrizzleDataSourceRepository,
  DrizzleUserWatchRepository,
  DrizzleUserAccountRepository,
} from "../../../../infra/repositories"
import {
  GitHubRepositoryStub,
  type LegacyGitHubRepositoryResponse,
} from "../../../../infra/adapters/github-repository"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { AuthTestHelper } from "../../../../../identity/test-helpers/auth-test-helper"
import { globalJWTAuth } from "../../../../../identity"
import type { User } from "../../../../../identity/domain/user"
import { db } from "../../../../../../db/connection"
import { events, notifications } from "../../../../../../db/schema"
import { DATA_SOURCE_TYPES } from "../../../../domain"

const createStubResponse = (
  overrides: Partial<LegacyGitHubRepositoryResponse> = {},
): LegacyGitHubRepositoryResponse => ({
  id: overrides.id ?? 10270250,
  full_name: overrides.full_name ?? "facebook/react",
  name: overrides.name ?? "react",
  description:
    overrides.description ??
    "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
  html_url: overrides.html_url ?? "https://github.com/facebook/react",
  private: overrides.private ?? false,
  language: overrides.language ?? "TypeScript",
  stargazers_count: overrides.stargazers_count ?? 210000,
  forks_count: overrides.forks_count ?? 45000,
  open_issues_count: overrides.open_issues_count ?? 900,
  fork: overrides.fork ?? false,
})

describe("DataSources API", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let githubStub: GitHubRepositoryStub
  let registerUseCase: RegisterDataSourceWatchUseCase
  let listUseCase: ListDataSourcesUseCase
  let getUseCase: GetDataSourceUseCase
  let updateUseCase: UpdateDataSourceUseCase
  let removeUseCase: RemoveDataSourceWatchUseCase
  let testUser: User
  let testToken: string

  beforeEach(async () => {
    AuthTestHelper.clearTestUsers()

    testUser = await TestDataFactory.createTestUser("auth0|test123")
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    const dataSourceRepository = new DrizzleDataSourceRepository()
    const userWatchRepository = new DrizzleUserWatchRepository()
    const userAccountRepository = new DrizzleUserAccountRepository()
    githubStub = new GitHubRepositoryStub()

    registerUseCase = new RegisterDataSourceWatchUseCase(
      dataSourceRepository,
      userWatchRepository,
      userAccountRepository,
      githubStub,
    )
    listUseCase = new ListDataSourcesUseCase(
      dataSourceRepository,
      userAccountRepository,
    )
    getUseCase = new GetDataSourceUseCase(
      dataSourceRepository,
      userAccountRepository,
    )
    updateUseCase = new UpdateDataSourceUseCase(
      dataSourceRepository,
      userWatchRepository,
      userAccountRepository,
    )
    removeUseCase = new RemoveDataSourceWatchUseCase(
      dataSourceRepository,
      userAccountRepository,
    )

    app = new OpenAPIHono()
    app.use("*", globalJWTAuth)
    app.route(
      "/",
      createDataSourceRoutes(
        registerUseCase,
        listUseCase,
        getUseCase,
        updateUseCase,
        removeUseCase,
      ),
    )
  })

  describe("POST /data-sources", () => {
    test("リポジトリを登録しウォッチ設定を作成できる", async () => {
      githubStub.setStubResponse(createStubResponse())

      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: "https://github.com/facebook/react",
          notificationEnabled: true,
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.dataSource.name).toBe("react")
      expect(body.data.userWatch.notificationEnabled).toBe(true)
    })

    test("重複登録では既存データを返す", async () => {
      githubStub.setStubResponse(createStubResponse())

      await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: "https://github.com/facebook/react",
        }),
      })

      const second = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: "https://github.com/facebook/react",
        }),
      })

      expect(second.status).toBe(201)
      const body = await second.json()
      expect(body.data.dataSource.repository.fullName).toBe("facebook/react")
    })
  })

  describe("GET /data-sources", () => {
    test("ウォッチ中のデータソース一覧を返す", async () => {
      githubStub.setStubResponse(createStubResponse())

      await registerUseCase.execute({
        repositoryUrl: "https://github.com/facebook/react",
        userId: testUser.auth0UserId,
      })

      const res = await app.request("/?perPage=10", {
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.items).toHaveLength(1)
      expect(body.data.pagination.total).toBe(1)
    })
  })

  describe("GET /data-sources/:id", () => {
    test("アクセス権がない場合は404", async () => {
      const otherUser = await TestDataFactory.createTestUser("auth0|other")
      const dataSource = await TestDataFactory.createTestDataSource({
        sourceId: "other/repo",
        sourceType: DATA_SOURCE_TYPES.GITHUB,
        repository: { githubId: 999, fullName: "other/repo" },
      })
      await TestDataFactory.createTestUserWatch(otherUser.id, dataSource.id, {})

      const res = await app.request(`/${dataSource.id}`, {
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PUT /data-sources/:id", () => {
    test("データソースとウォッチ設定を更新できる", async () => {
      githubStub.setStubResponse(createStubResponse())
      const { dataSource } = await registerUseCase.execute({
        repositoryUrl: "https://github.com/facebook/react",
        userId: testUser.auth0UserId,
      })

      const res = await app.request(`/${dataSource.id}`, {
        method: "PUT",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "ReactJS",
          notificationEnabled: false,
          watchIssues: true,
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.dataSource.name).toBe("ReactJS")
      expect(body.data.userWatch.notificationEnabled).toBe(false)
      expect(body.data.userWatch.watchIssues).toBe(true)
    })
  })

  describe("DELETE /data-sources/:id", () => {
    test("ウォッチ解除し関連データを削除する", async () => {
      githubStub.setStubResponse(createStubResponse())
      const { dataSource } = await registerUseCase.execute({
        repositoryUrl: "https://github.com/facebook/react",
        userId: testUser.auth0UserId,
      })

      const event = await TestDataFactory.createTestEvent(dataSource.id)
      const notification = await TestDataFactory.createTestNotification(
        testUser.id,
        event.id,
      )

      const res = await app.request(`/${dataSource.id}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(204)

      const eventExists = await db
        .select()
        .from(events)
        .where(eq(events.id, event.id))
      expect(eventExists).toHaveLength(0)

      const notificationExists = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notification.id))
      expect(notificationExists).toHaveLength(0)
    })
  })
})
