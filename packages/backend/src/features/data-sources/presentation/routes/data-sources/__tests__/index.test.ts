import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createDataSourceRoutes } from "../index"
import { DataSourceCreationService, DataSourceListService, DataSourceDetailService } from "../../../../services"
import {
  DataSourceRepository,
  RepositoryRepository,
  UserWatchRepository,
} from "../../../../repositories"
import { UserRepository } from "../../../../../user/repositories/user.repository"
import { GitHubApiServiceStub } from "../../../../services/github-api-service.stub"
import type { GitHubRepositoryResponse } from "../../../../services/interfaces/github-api-service.interface"
import { setupComponentTest, TestDataFactory } from "../../../../../../test"
import { AuthTestHelper } from "../../../../../auth/test-helpers/auth-test-helper"
import { globalJWTAuth } from "../../../../../auth"
import type { User } from "../../../../../user/domain/user"

// Component Test: 実DBを使用してHTTPエンドポイントをテスト

describe("DataSources API - Component Test", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let dataSourceCreationService: DataSourceCreationService
  let dataSourceListService: DataSourceListService
  let dataSourceDetailService: DataSourceDetailService
  let githubStub: GitHubApiServiceStub
  let testUser: User
  let testToken: string

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
    const repositoryRepository = new RepositoryRepository()
    const userWatchRepository = new UserWatchRepository()
    const userRepository = new UserRepository()
    dataSourceCreationService = new DataSourceCreationService(
      dataSourceRepository,
      repositoryRepository,
      userWatchRepository,
      userRepository,
      githubStub,
    )
    dataSourceListService = new DataSourceListService(
      dataSourceRepository,
      userRepository,
    )
    dataSourceDetailService = new DataSourceDetailService(
      dataSourceRepository,
      userRepository,
    )

    // ルートアプリケーション作成
    app = new OpenAPIHono()

    // 認証ミドルウェアを追加
    app.use("*", globalJWTAuth)

    // データソースルートを追加
    const dataSourceRoutes = createDataSourceRoutes(
      dataSourceCreationService, 
      dataSourceListService,
      dataSourceDetailService
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
      githubStub.setStubResponse("facebook/react", githubResponse)

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
      expect(responseBody.data.repository.fullName).toBe("facebook/react")
      expect(responseBody.data.repository.githubId).toBe(10270250)
      expect(responseBody.data.repository.language).toBe("JavaScript")
      expect(responseBody.data.repository.starsCount).toBe(230000)
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
      githubStub.setStubResponse("microsoft/typescript", githubResponse)

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
      expect(responseBody.data.repository.fullName).toBe("microsoft/typescript")
      expect(responseBody.data.repository.language).toBe("TypeScript")

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

    test("重複エラーの場合は409エラー", async () => {
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
      githubStub.setStubResponse("facebook/react", githubResponse)

      // 最初のリクエストで同じリポジトリを作成
      await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      // 2回目のリクエストで重複エラーが発生することを確認
      const res = await app.request("/", {
        method: "POST",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      expect(res.status).toBe(409)

      const responseBody = await res.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe("DUPLICATE_REPOSITORY")
    })

    test("GitHub APIエラーの場合は適切なエラーレスポンス", async () => {
      const requestBody = {
        repositoryUrl: "https://github.com/nonexistent/repo",
      }

      // GitHubスタブでエラーシナリオを設定
      githubStub.setErrorScenario("nonexistent/repo", {
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
      githubStub.setStubResponse(fullName, githubResponse)

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
      expect(firstItem.repository).toBeDefined()
      expect(firstItem.userWatch).toBeDefined()
      expect(firstItem.repository.owner).toBeDefined()
    })

    test("名前フィルタリングが正常に動作する", async () => {
      // テストデータを作成
      await createTestDataSource("React", "facebook/react", 10270250)
      await createTestDataSource("ReactNative", "facebook/react-native", 29028775)
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
      await createTestDataSource("ReactNative", "facebook/react-native", 29028775)
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
      expect(responseBody.data.items[0].repository.owner).toBe("facebook")
      expect(responseBody.data.items[1].repository.owner).toBe("facebook")
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
      expect(responseBody.data.items[0].repository.fullName).toContain("facebook")
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
      })

      await TestDataFactory.createTestRepository(testDataSource.id, {
        fullName: "facebook/react",
        githubId: 10270250,
        language: "JavaScript",
        starsCount: 230000,
      })

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
          notificationEnabled: true,
        }
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
      expect(responseBody.data.repository.fullName).toBe("facebook/react")
      expect(responseBody.data.repository.owner).toBe("facebook")
      expect(responseBody.data.repository.githubId).toBe(10270250)
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
      })

      await TestDataFactory.createTestRepository(otherDataSource.id, {
        fullName: "other/repo",
        githubId: 999999999,
      })

      await TestDataFactory.createTestUserWatch(
        otherUser.id,
        otherDataSource.id,
        {}
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
})
