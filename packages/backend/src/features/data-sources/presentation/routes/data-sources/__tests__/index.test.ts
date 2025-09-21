import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createDataSourceRoutes } from "../index"
import {
  DataSourceCreationService,
  DataSourceWatchService,
  DataSourceListService,
  DataSourceDetailService,
  DataSourceUpdateService,
  DataSourceDeletionService,
} from "../../../../services"
import {
  DataSourceRepository,
  UserWatchRepository,
} from "../../../../repositories"
import { UserRepository } from "../../../../../user/repositories/user.repository"
import { GitHubApiServiceStub } from "../../../../services/github-api-service.stub"
import type { GitHubRepositoryResponse } from "../../../../services/interfaces/github-api-service.interface"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { AuthTestHelper } from "../../../../../identity/testing/auth-test-helper"
import {
  createGlobalJwtAuth,
  StubJwtValidatorAdapter,
} from "../../../../../identity"
import type { User } from "../../../../../user/domain/user"
import { db } from "../../../../../../db/connection"
import { events, notifications } from "../../../../../../db/schema"
import { eq } from "drizzle-orm"

// Component Test: 実DBを使用してHTTPエンドポイントをテスト

describe("DataSources API - Component Test", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let dataSourceCreationService: DataSourceCreationService
  let dataSourceWatchService: DataSourceWatchService
  let dataSourceListService: DataSourceListService
  let dataSourceDetailService: DataSourceDetailService
  let dataSourceUpdateService: DataSourceUpdateService
  let dataSourceDeletionService: DataSourceDeletionService
  let githubStub: GitHubApiServiceStub
  let testUser: User
  let testToken: string
  let globalJWTAuth: ReturnType<typeof createGlobalJwtAuth>

  beforeEach(async () => {
    // テストユーザーの認証設定をクリア
    AuthTestHelper.clearTestUsers()

    // テストユーザーをDBに作成
    testUser = await TestDataFactory.createTestUser("auth0|test123")

    // テスト用トークンを生成
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    // GitHubスタブを作成
    githubStub = new GitHubApiServiceStub()

    // 実際のリポジトリとサービスを作成（スタブを注入）
    const dataSourceRepository = new DataSourceRepository()
    const userWatchRepository = new UserWatchRepository()
    const userRepository = new UserRepository()
    dataSourceCreationService = new DataSourceCreationService(
      dataSourceRepository,
      githubStub,
    )
    dataSourceWatchService = new DataSourceWatchService(
      dataSourceCreationService,
      userWatchRepository,
      userRepository,
    )
    dataSourceListService = new DataSourceListService(
      dataSourceRepository,
      userRepository,
    )
    dataSourceDetailService = new DataSourceDetailService(
      dataSourceRepository,
      userRepository,
    )
    dataSourceUpdateService = new DataSourceUpdateService(
      dataSourceRepository,
      userWatchRepository,
      userRepository,
    )
    dataSourceDeletionService = new DataSourceDeletionService(
      dataSourceRepository,
      userRepository,
    )

    // ルートアプリケーション作成
    app = new OpenAPIHono()

    // 認証ミドルウェアを追加
    const validatorFactory = () => new StubJwtValidatorAdapter()
    globalJWTAuth = createGlobalJwtAuth({ validatorFactory })
    app.use("*", globalJWTAuth)

    // データソースルートを追加
    const dataSourceRoutes = createDataSourceRoutes(
      dataSourceWatchService,
      dataSourceListService,
      dataSourceDetailService,
      dataSourceUpdateService,
      dataSourceDeletionService,
    )
    app.route("/", dataSourceRoutes)
  })

  describe("POST /data-sources - データソース作成", () => {
    test("有効なリクエストでデータソースが作成される", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/facebook/react",
        name: "React",
        description: "A JavaScript library",
        notificationEnabled: true,
        watchReleases: true,
        watchIssues: false,
        watchPullRequests: false,
      }

      // GitHubスタブレスポンスを設定
      const githubResponse: GitHubRepositoryResponse = {
        id: 10270250,
        full_name: "facebook/react",
        name: "react",
        description:
          "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
        html_url: "https://github.com/facebook/react",
        private: false,
        language: "JavaScript",
        stargazers_count: 230000,
        forks_count: 47000,
        open_issues_count: 1500,
        fork: false,
      }
      githubStub.setStubResponse(githubResponse)

      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(res.status).toBe(201)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.dataSource.name).toBe("React")
      expect(responseBody.data.dataSource.sourceId).toBe("10270250")
      expect(responseBody.data.dataSource.url).toBe(
        "https://github.com/facebook/react",
      )
      expect(responseBody.data.dataSource.repository.fullName).toBe(
        "facebook/react",
      )
      expect(responseBody.data.dataSource.repository.githubId).toBe(10270250)
      expect(responseBody.data.dataSource.repository.language).toBe(
        "JavaScript",
      )
      expect(responseBody.data.dataSource.repository.starsCount).toBe(230000)
      expect(responseBody.data.userWatch.userId).toBe(testUser.id)
      expect(responseBody.data.userWatch.notificationEnabled).toBe(true)
      expect(responseBody.data.userWatch.watchReleases).toBe(true)
      expect(responseBody.data.userWatch.watchIssues).toBe(false)
      expect(responseBody.data.userWatch.watchPullRequests).toBe(false)
    })

    test("最小限のリクエストでもデータソースが作成される", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/microsoft/typescript",
      }

      // GitHubスタブレスポンスを設定
      const githubResponse: GitHubRepositoryResponse = {
        id: 1234567,
        full_name: "microsoft/typescript",
        name: "TypeScript",
        description:
          "TypeScript is a superset of JavaScript that compiles to plain JavaScript.",
        html_url: "https://github.com/microsoft/typescript",
        private: false,
        language: "TypeScript",
        stargazers_count: 100000,
        forks_count: 12000,
        open_issues_count: 500,
        fork: false,
      }
      githubStub.setStubResponse(githubResponse)

      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(res.status).toBe(201)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)

      // nameが指定されていない場合、GitHubのnameが使用されることを確認
      expect(responseBody.data.dataSource.name).toBe("TypeScript")
      expect(responseBody.data.dataSource.sourceId).toBe("1234567")
      expect(responseBody.data.dataSource.repository.fullName).toBe(
        "microsoft/typescript",
      )
      expect(responseBody.data.dataSource.repository.language).toBe(
        "TypeScript",
      )

      // デフォルト値での作成を確認
      expect(responseBody.data.userWatch.notificationEnabled).toBe(true)
      expect(responseBody.data.userWatch.watchReleases).toBe(true)
      expect(responseBody.data.userWatch.watchIssues).toBe(false)
      expect(responseBody.data.userWatch.watchPullRequests).toBe(false)
    })
  })

  describe("POST /data-sources - 異常系", () => {
    test("無効なリクエストボディの場合は400エラー", async () => {
      const invalidRequestBody = {
        repositoryUrl: "", // 空文字列は無効
      }

      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidRequestBody),
      })

      expect(res.status).toBe(400)
    })

    test("認証情報がない場合は認証エラー", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/facebook/react",
      }

      const res = await app.request("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      // 認証エラーまたは401ステータスが返される
      expect(res.status).toBe(401)
    })

    test("重複データソースの場合は既存レコードが返される（upsert動作）", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/facebook/react",
      }

      // GitHubスタブレスポンスを設定
      const githubResponse: GitHubRepositoryResponse = {
        id: 10270250,
        full_name: "facebook/react",
        name: "react",
        description:
          "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
        html_url: "https://github.com/facebook/react",
        private: false,
        language: "JavaScript",
        stargazers_count: 230000,
        forks_count: 47000,
        open_issues_count: 1500,
        fork: false,
      }
      githubStub.setStubResponse(githubResponse)

      // 最初のリクエストで同じリポジトリを作成
      const firstRes = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(firstRes.status).toBe(201)
      const firstResponseBody = await firstRes.json()

      // 2回目のリクエストで同じリポジトリを作成（upsert動作）
      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(res.status).toBe(201)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      // 既存レコードが返されることを確認
      expect(responseBody.data.dataSource.id).toBe(
        firstResponseBody.data.dataSource.id,
      )
      expect(responseBody.data.dataSource.repository.id).toBe(
        firstResponseBody.data.dataSource.repository.id,
      )
      expect(responseBody.data.userWatch.id).toBe(
        firstResponseBody.data.userWatch.id,
      )
    })

    test("GitHub APIエラーの場合は適切なエラーレスポンス", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/nonexistent/repo",
      }

      // GitHubスタブでエラーシナリオを設定
      githubStub.setStubResponse({
        status: 404,
        message: "Repository nonexistent/repo not found or not accessible",
      })

      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("REPOSITORY_NOT_FOUND")
    })
  })

  describe("GET /data-sources - データソース一覧取得", () => {
    // テストデータのセットアップ用ヘルパー
    const createTestDataSource = async (
      name: string,
      fullName: string,
      githubId: number,
    ) => {
      const githubResponse: GitHubRepositoryResponse = {
        id: githubId,
        full_name: fullName,
        name: name,
        description: `${name} description`,
        html_url: `https://github.com/${fullName}`,
        private: false,
        language: "TypeScript",
        stargazers_count: 1000,
        forks_count: 100,
        open_issues_count: 10,
        fork: false,
      }
      githubStub.setStubResponse(githubResponse)

      const requestBody = {
        repositoryUrl: `https://github.com/${fullName}`,
        name: name,
      }

      await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
    }

    test("空の一覧が正常に取得される", async () => {
      const res = await app.request("/", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(0)
      expect(responseBody.data.pagination.total).toBe(0)
      expect(responseBody.data.pagination.totalPages).toBe(0)
      expect(responseBody.data.pagination.hasNext).toBe(false)
      expect(responseBody.data.pagination.hasPrev).toBe(false)
    })

    test("複数のデータソースが正常に取得される", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource("Vue", "vuejs/core", 11730342)
      await createTestDataSource("Angular", "angular/angular", 24195339)

      const res = await app.request("/", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(3)
      expect(responseBody.data.pagination.total).toBe(3)
      expect(responseBody.data.pagination.totalPages).toBe(1)
      expect(responseBody.data.pagination.hasNext).toBe(false)
      expect(responseBody.data.pagination.hasPrev).toBe(false)

      // レスポンス構造を確認
      const firstItem = responseBody.data.items[0]
      expect(firstItem.dataSource).toBeDefined()
      expect(firstItem.dataSource.repository).toBeDefined()
      expect(firstItem.userWatch).toBeDefined()
      expect(firstItem.dataSource.repository.owner).toBeDefined()
    })

    test("名前フィルタリングが正常に動作する", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource(
        "ReactNative",
        "facebook/react-native",
        29028775,
      )
      await createTestDataSource("Vue", "vuejs/core", 11730342)

      const res = await app.request("/?name=React", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(2)
      expect(responseBody.data.items[0].dataSource.name).toContain("React")
      expect(responseBody.data.items[1].dataSource.name).toContain("React")
    })

    test("オーナーフィルタリングが正常に動作する", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource(
        "ReactNative",
        "facebook/react-native",
        29028775,
      )
      await createTestDataSource("Vue", "vuejs/core", 11730342)

      const res = await app.request("/?owner=facebook", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(2)
      expect(responseBody.data.items[0].dataSource.repository.owner).toBe(
        "facebook",
      )
      expect(responseBody.data.items[1].dataSource.repository.owner).toBe(
        "facebook",
      )
    })

    test("フリーワード検索が正常に動作する", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource("Vue", "vuejs/core", 11730342)

      const res = await app.request("/?search=facebook", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(1)
      expect(
        responseBody.data.items[0].dataSource.repository.fullName,
      ).toContain("facebook")
    })

    test("ページネーションが正常に動作する", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource("Vue", "vuejs/core", 11730342)
      await createTestDataSource("Angular", "angular/angular", 24195339)

      const res = await app.request("/?page=1&perPage=2", {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.items).toHaveLength(2)
      expect(responseBody.data.pagination.page).toBe(1)
      expect(responseBody.data.pagination.perPage).toBe(2)
      expect(responseBody.data.pagination.total).toBe(3)
      expect(responseBody.data.pagination.totalPages).toBe(2)
      expect(responseBody.data.pagination.hasNext).toBe(true)
      expect(responseBody.data.pagination.hasPrev).toBe(false)
    })

    test("認証情報がない場合は401エラー", async () => {
      const res = await app.request("/", {
        method: "GET",
      })

      expect(res.status).toBe(401)
    })
  })

  describe("GET /data-sources/{id} - データソース詳細取得", () => {
    test("有効なIDでデータソース詳細を取得できる", async () => {
      // テストデータを作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          fullName: "facebook/react",
          githubId: 10270250,
          language: "JavaScript",
          starsCount: 230000,
        },
      })

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
          notificationEnabled: true,
        },
      )

      const res = await app.request(`/${testDataSource.id}`, {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(200)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.dataSource.id).toBe(testDataSource.id)
      expect(responseBody.data.dataSource.name).toBe("React")
      expect(responseBody.data.dataSource.repository.fullName).toBe(
        "facebook/react",
      )
      expect(responseBody.data.dataSource.repository.owner).toBe("facebook")
      expect(responseBody.data.dataSource.repository.githubId).toBe(10270250)
      expect(responseBody.data.userWatch.userId).toBe(testUser.id)
      expect(responseBody.data.userWatch.watchReleases).toBe(true)
    })

    test("他のユーザーのデータソースにアクセスした場合は404エラー", async () => {
      // 他のユーザーを作成
      const otherUser = await TestDataFactory.createTestUser("auth0|other123")

      // 他のユーザーのデータソースを作成
      const otherDataSource = await TestDataFactory.createTestDataSource({
        name: "Other Repository",
        sourceId: "other123456",
        sourceType: "github",
        repository: {
          fullName: "other/repo",
          githubId: 999999999,
        },
      })

      await TestDataFactory.createTestUserWatch(
        otherUser.id,
        otherDataSource.id,
        {},
      )

      // testUserで他のユーザーのデータソースにアクセス
      const res = await app.request(`/${otherDataSource.id}`, {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DATA_SOURCE_NOT_FOUND")
    })

    test("存在しないIDの場合は404エラー", async () => {
      const nonExistentId = "550e8400-e29b-41d4-a716-446655440000"

      const res = await app.request(`/${nonExistentId}`, {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DATA_SOURCE_NOT_FOUND")
    })

    test("無効なUUID形式の場合は400エラー", async () => {
      const invalidId = "invalid-uuid"

      const res = await app.request(`/${invalidId}`, {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(400)
    })

    test("認証情報がない場合は401エラー", async () => {
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        sourceId: "10270250",
        sourceType: "github",
      })

      const res = await app.request(`/${testDataSource.id}`, {
        method: "GET",
      })

      expect(res.status).toBe(401)
    })
  })

  describe("PUT /data-sources/{id} - データソース更新", () => {
    test("有効なリクエストでデータソースが更新される", async () => {
      // テストデータを作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Original React",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          githubId: 10270250,
          fullName: "facebook/react",
        },
      })

      const testUserWatch = await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
        },
      )

      const updateRequest = {
        name: "Updated React Library",
        description: "Updated description for React",
        notificationEnabled: false,
        watchReleases: false,
        watchIssues: true,
        watchPullRequests: true,
      }

      const res = await app.request(`/${testDataSource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(200)

      const result = await res.json()
      expect(result).toMatchObject({
        success: true,
        data: {
          dataSource: {
            id: testDataSource.id,
            name: "Updated React Library",
            description: "Updated description for React",
            sourceType: "github",
            sourceId: "10270250",
            repository: expect.objectContaining({
              githubId: 10270250,
              fullName: "facebook/react",
            }),
          },
          userWatch: {
            id: testUserWatch.id,
            userId: testUser.id,
            dataSourceId: testDataSource.id,
            notificationEnabled: false,
            watchReleases: false,
            watchIssues: true,
            watchPullRequests: true,
          },
        },
      })
    })

    test("部分更新が正常に動作する", async () => {
      // テストデータを作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Original Name",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          githubId: 10270250,
          fullName: "facebook/react",
        },
      })

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
        },
      )

      // 名前のみ更新
      const updateRequest = {
        name: "Updated Name Only",
      }

      const res = await app.request(`/${testDataSource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(200)

      const result = await res.json()
      expect(result.data.dataSource.name).toBe("Updated Name Only")
      expect(result.data.dataSource.description).toBe(
        testDataSource.description,
      ) // 元の値のまま
      // UserWatch設定も元のまま
      expect(result.data.userWatch.notificationEnabled).toBe(true)
      expect(result.data.userWatch.watchReleases).toBe(true)
      expect(result.data.userWatch.watchIssues).toBe(false)
      expect(result.data.userWatch.watchPullRequests).toBe(false)
    })

    test("他のユーザーのデータソースは更新できない", async () => {
      // 他のユーザーのデータソースを作成
      const otherUser = await TestDataFactory.createTestUser("auth0|other456")
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Other User's DataSource",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          githubId: 10270250,
          fullName: "facebook/react",
        },
      })

      await TestDataFactory.createTestUserWatch(
        otherUser.id,
        testDataSource.id,
        {
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
        },
      )

      const updateRequest = {
        name: "Hacked Name",
      }

      const res = await app.request(`/${testDataSource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(404)
    })

    test("存在しないデータソースの更新は404エラー", async () => {
      const nonExistentId = "550e8400-e29b-41d4-a716-446655440000"

      const updateRequest = {
        name: "New Name",
      }

      const res = await app.request(`/${nonExistentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(404)
    })

    test("無効なUUIDは400エラー", async () => {
      const invalidId = "invalid-uuid"

      const updateRequest = {
        name: "New Name",
      }

      const res = await app.request(`/${invalidId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(400)
    })

    test("認証情報がない場合は401エラー", async () => {
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Test DataSource",
        sourceId: "10270250",
        sourceType: "github",
      })

      const updateRequest = {
        name: "New Name",
      }

      const res = await app.request(`/${testDataSource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(401)
    })

    test("空のリクエストボディでも正常処理", async () => {
      // テストデータを作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Original Name",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          githubId: 10270250,
          fullName: "facebook/react",
        },
      })

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
        },
      )

      // 空のリクエストボディ
      const updateRequest = {}

      const res = await app.request(`/${testDataSource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
        body: JSON.stringify(updateRequest),
      })

      expect(res.status).toBe(200)

      const result = await res.json()
      // 元の値がそのまま返される
      expect(result.data.dataSource.name).toBe(testDataSource.name)
      expect(result.data.dataSource.description).toBe(
        testDataSource.description,
      )
      expect(result.data.userWatch.notificationEnabled).toBe(true)
    })
  })

  describe("DELETE /data-sources/{id} - データソース削除", () => {
    test("有効なIDでデータソースの監視が削除される", async () => {
      // テストデータを作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        sourceId: "10270250",
        sourceType: "github",
        repository: {
          fullName: "facebook/react",
          githubId: 10270250,
          language: "JavaScript",
          starsCount: 230000,
        },
      })

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
          notificationEnabled: true,
        },
      )

      // テスト用のイベントと通知を作成
      const testEvent = await TestDataFactory.createTestEvent(
        testDataSource.id,
        {
          eventType: "release",
          title: "Test Release",
          body: "Test release body",
          version: "v1.0.0",
        },
      )

      const testNotification = await TestDataFactory.createTestNotification(
        testUser.id,
        testEvent.id,
        {
          title: "New Release Available",
          message: "Test release notification",
          notificationType: "release",
          isRead: false,
        },
      )

      const res = await app.request(`/${testDataSource.id}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(204)

      // レスポンスボディは空であることを確認
      const responseText = await res.text()
      expect(responseText).toBe("")

      // 削除後に詳細取得すると404になることを確認
      const getRes = await app.request(`/${testDataSource.id}`, {
        method: "GET",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(getRes.status).toBe(404)

      // eventsとnotificationsが削除されたことを確認
      const eventExists = await db
        .select()
        .from(events)
        .where(eq(events.id, testEvent.id))
      expect(eventExists).toHaveLength(0)

      const notificationExists = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, testNotification.id))
      expect(notificationExists).toHaveLength(0)
    })

    test("他のユーザーのデータソースは削除できない", async () => {
      // 他のユーザーを作成
      const otherUser = await TestDataFactory.createTestUser("auth0|other123")

      // 他のユーザーのデータソースを作成
      const otherDataSource = await TestDataFactory.createTestDataSource({
        name: "Other Repository",
        sourceId: "other123456",
        sourceType: "github",
        repository: {
          fullName: "other/repo",
          githubId: 999999999,
        },
      })

      await TestDataFactory.createTestUserWatch(
        otherUser.id,
        otherDataSource.id,
        {},
      )

      // testUserで他のユーザーのデータソースを削除しようとする
      const res = await app.request(`/${otherDataSource.id}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DATA_SOURCE_NOT_FOUND")
    })

    test("存在しないIDの場合は404エラー", async () => {
      const nonExistentId = "550e8400-e29b-41d4-a716-446655440000"

      const res = await app.request(`/${nonExistentId}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DATA_SOURCE_NOT_FOUND")
    })

    test("無効なUUID形式の場合は400エラー", async () => {
      const invalidId = "invalid-uuid"

      const res = await app.request(`/${invalidId}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(400)
    })

    test("認証情報がない場合は401エラー", async () => {
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        sourceId: "10270250",
        sourceType: "github",
      })

      const res = await app.request(`/${testDataSource.id}`, {
        method: "DELETE",
      })

      expect(res.status).toBe(401)
    })

    test("ユーザーがウォッチしていないデータソースは削除できない", async () => {
      // データソースのみ作成（ユーザーウォッチなし）
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "Unwatched Repository",
        sourceId: "unwatched123",
        sourceType: "github",
        repository: {
          fullName: "unwatched/repo",
          githubId: 123456789,
        },
      })

      const res = await app.request(`/${testDataSource.id}`, {
        method: "DELETE",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
        },
      })

      expect(res.status).toBe(404)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DATA_SOURCE_NOT_FOUND")
    })
  })
})
