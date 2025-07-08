import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createDataSourceRoutes } from "../index"
import { DataSourceCreationService } from "../../../../services"
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

describe("POST /data-sources - Component Test", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let dataSourceCreationService: DataSourceCreationService
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

    // ルートアプリケーション作成
    app = new OpenAPIHono()

    // 認証ミドルウェアを追加
    app.use("*", globalJWTAuth)

    // データソースルートを追加
    const dataSourceRoutes = createDataSourceRoutes(dataSourceCreationService)
    app.route("/", dataSourceRoutes)
  })

  describe("正常系", () => {
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

  describe("異常系", () => {
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
})
