import { describe, test, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { createDataSourceRoutes } from "../routes"
import { GitHubRepoServiceStub } from "../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../services/__tests__/test-data-builder"
import {
  GitHubApiError,
  GitHubAuthenticationError,
  GitHubRateLimitError,
} from "../../errors/github-api.error"

describe("GitHub API Integration Tests", () => {
  let app: Hono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new Hono().route(
      "/api/datasource",
      createDataSourceRoutes(githubServiceStub),
    )
  })

  describe("完全なユーザーフロー", () => {
    test("ユーザーのリポジトリ管理フロー", async () => {
      // 1. ユーザーのwatchedリポジトリ一覧を取得
      const mockRepositories = [
        TestDataBuilder.createRepository({
          name: "test-repo-1",
          owner: {
            login: "test-user",
            id: 12345,
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            htmlUrl: "https://github.com/test-user",
            type: "User" as const,
          },
        }),
        TestDataBuilder.createRepository({
          name: "test-repo-2",
          owner: {
            login: "test-user",
            id: 12345,
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            htmlUrl: "https://github.com/test-user",
            type: "User" as const,
          },
        }),
      ]
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const watchedRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(watchedRes.status).toBe(200)

      const watchedData = await watchedRes.json()
      expect(watchedData).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ name: "test-repo-1" }),
          expect.objectContaining({ name: "test-repo-2" }),
        ]),
      })
      expect(watchedData.data).toHaveLength(2)

      // 2. 特定のリポジトリ詳細を取得
      const targetRepo = mockRepositories[0]
      githubServiceStub.setRepositoryDetails(
        targetRepo.owner.login,
        targetRepo.name,
        targetRepo,
      )

      const repoRes = await app.request(
        `/api/datasource/repositories/${targetRepo.owner.login}/${targetRepo.name}`,
      )
      expect(repoRes.status).toBe(200)

      const repoData = await repoRes.json()
      expect(repoData).toMatchObject({
        success: true,
        data: expect.objectContaining({
          name: targetRepo.name,
        }),
      })

      // 3. そのリポジトリのリリース一覧を取得
      const mockReleases = [
        TestDataBuilder.createRelease({ tagName: "v1.0.0" }),
        TestDataBuilder.createRelease({ tagName: "v0.9.0" }),
      ]
      githubServiceStub.setRepositoryReleases(
        targetRepo.owner.login,
        targetRepo.name,
        mockReleases,
      )

      const releasesRes = await app.request(
        `/api/datasource/repositories/${targetRepo.owner.login}/${targetRepo.name}/releases`,
      )
      expect(releasesRes.status).toBe(200)

      const releasesData = await releasesRes.json()
      expect(releasesData).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ tagName: "v1.0.0" }),
          expect.objectContaining({ tagName: "v0.9.0" }),
        ]),
      })
      expect(releasesData.data).toHaveLength(2)

      // 4. プルリクエスト一覧を取得
      const mockPulls = [
        TestDataBuilder.createPullRequest({ title: "Fix bug" }),
        TestDataBuilder.createPullRequest({ title: "Add feature" }),
      ]
      githubServiceStub.setRepositoryPullRequests(
        targetRepo.owner.login,
        targetRepo.name,
        mockPulls,
      )

      const pullsRes = await app.request(
        `/api/datasource/repositories/${targetRepo.owner.login}/${targetRepo.name}/pulls?state=open`,
      )
      expect(pullsRes.status).toBe(200)

      const pullsData = await pullsRes.json()
      expect(pullsData).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ title: "Fix bug" }),
          expect.objectContaining({ title: "Add feature" }),
        ]),
      })
      expect(pullsData.data).toHaveLength(2)

      // 5. イシュー一覧を取得
      const mockIssues = [
        TestDataBuilder.createIssue({ title: "Bug report" }),
        TestDataBuilder.createIssue({ title: "Feature request" }),
      ]
      githubServiceStub.setRepositoryIssues(
        targetRepo.owner.login,
        targetRepo.name,
        mockIssues,
      )

      const issuesRes = await app.request(
        `/api/datasource/repositories/${targetRepo.owner.login}/${targetRepo.name}/issues?state=open`,
      )
      expect(issuesRes.status).toBe(200)

      const issuesData = await issuesRes.json()
      expect(issuesData).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ title: "Bug report" }),
          expect.objectContaining({ title: "Feature request" }),
        ]),
      })
      expect(issuesData.data).toHaveLength(2)
    })

    test("ページネーション機能の完全テスト", async () => {
      // 大量のリポジトリデータを準備
      const totalRepos = 25
      const mockRepositories = Array.from({ length: totalRepos }, (_, i) =>
        TestDataBuilder.createRepository({
          name: `repo-${i + 1}`,
          owner: {
            login: "test-user",
            id: 12345,
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            htmlUrl: "https://github.com/test-user",
            type: "User" as const,
          },
        }),
      )
      githubServiceStub.setWatchedRepositories(mockRepositories)

      // 1ページ目（10件）
      const page1Res = await app.request(
        "/api/datasource/repositories/watched?page=1&perPage=10",
      )
      expect(page1Res.status).toBe(200)

      const page1Data = await page1Res.json()
      expect(page1Data).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: {
          page: 1,
          hasNext: true,
          total: totalRepos,
        },
      })
      expect(page1Data.data).toHaveLength(10)

      // 2ページ目（10件）
      const page2Res = await app.request(
        "/api/datasource/repositories/watched?page=2&perPage=10",
      )
      expect(page2Res.status).toBe(200)

      const page2Data = await page2Res.json()
      expect(page2Data).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 2,
        }),
      })
      expect(page2Data.data).toHaveLength(10)

      // 最終ページ（5件）
      const page3Res = await app.request(
        "/api/datasource/repositories/watched?page=3&perPage=10",
      )
      expect(page3Res.status).toBe(200)

      const page3Data = await page3Res.json()
      expect(page3Data).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 3,
        }),
      })
      expect(page3Data.data).toHaveLength(5)
    })
  })

  describe("エラー処理の完全テスト", () => {
    test("認証エラーから復旧までのフロー", async () => {
      // 1. 最初は認証エラー
      const authError = new GitHubAuthenticationError(
        "GitHub authentication failed",
      )
      githubServiceStub.setWatchedRepositoriesError(authError)

      const authErrorRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(authErrorRes.status).toBe(401)

      const authErrorData = await authErrorRes.json()
      expect(authErrorData).toMatchObject({
        success: false,
        error: {
          code: "GITHUB_AUTH_ERROR",
          message: expect.any(String),
        },
      })

      // 2. 認証が復旧した後の正常レスポンス
      githubServiceStub.clearErrors() // エラーをクリア
      const mockRepositories = [TestDataBuilder.createRepository()]
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const successRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(successRes.status).toBe(200)

      const successData = await successRes.json()
      expect(successData).toMatchObject({
        success: true,
        data: expect.any(Array),
      })
      expect(successData.data).toHaveLength(1)
    })

    test("レート制限エラーのハンドリング", async () => {
      const rateLimitError = new GitHubRateLimitError(
        "Rate limit exceeded",
        new Date(Date.now() + 3600000), // 1時間後
        0,
      )

      githubServiceStub.setWatchedRepositoriesError(rateLimitError)

      const rateLimitRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(rateLimitRes.status).toBe(429)

      const rateLimitData = await rateLimitRes.json()
      expect(rateLimitData).toMatchObject({
        success: false,
        error: {
          code: "GITHUB_RATE_LIMIT",
          message: expect.any(String),
          details: {
            resetTime: expect.any(String),
            remaining: expect.any(Number),
          },
        },
      })
    })

    test("ネットワークエラーのハンドリング", async () => {
      const networkError = new Error("Network connection failed")
      githubServiceStub.setWatchedRepositoriesError(networkError)

      const networkErrorRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(networkErrorRes.status).toBe(500)

      const networkErrorData = await networkErrorRes.json()
      expect(networkErrorData).toMatchObject({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "内部サーバーエラーが発生しました",
        },
      })
    })
  })

  describe("パフォーマンステスト", () => {
    test("大量データの処理パフォーマンス", async () => {
      // 100件のリポジトリデータを準備
      const mockRepositories = Array.from({ length: 100 }, (_, i) =>
        TestDataBuilder.createRepository({
          name: `large-repo-${i + 1}`,
          owner: {
            login: "test-user",
            id: 12345,
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            htmlUrl: "https://github.com/test-user",
            type: "User" as const,
          },
        }),
      )
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const startTime = Date.now()
      const res = await app.request(
        "/api/datasource/repositories/watched?perPage=100",
      )
      const endTime = Date.now()

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Array),
      })
      expect(data.data).toHaveLength(100)

      // レスポンス時間が1秒以内であることを確認
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(1000)
    })

    test("並行リクエストの処理", async () => {
      const mockRepository = TestDataBuilder.createRepository()
      githubServiceStub.setRepositoryDetails("owner", "repo", mockRepository)

      // 10個の並行リクエストを送信
      const promises = Array.from({ length: 10 }, () =>
        app.request("/api/datasource/repositories/owner/repo"),
      )

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()

      // すべてのリクエストが成功することを確認
      expect(responses.every((res) => res.status === 200)).toBe(true)

      // 並行処理により合計時間が短縮されることを確認
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(2000) // 2秒以内
    })
  })

  describe("データ一貫性テスト", () => {
    test("レスポンス形式の一貫性", async () => {
      const mockRepository = TestDataBuilder.createRepository()
      const mockReleases = [TestDataBuilder.createRelease()]
      const mockPulls = [TestDataBuilder.createPullRequest()]
      const mockIssues = [TestDataBuilder.createIssue()]

      githubServiceStub.setWatchedRepositories([mockRepository])
      githubServiceStub.setRepositoryDetails("owner", "repo", mockRepository)
      githubServiceStub.setRepositoryReleases("owner", "repo", mockReleases)
      githubServiceStub.setRepositoryPullRequests("owner", "repo", mockPulls)
      githubServiceStub.setRepositoryIssues("owner", "repo", mockIssues)

      // watch済みリポジトリエンドポイント（total付きページネーション）
      const watchedRes = await app.request(
        "/api/datasource/repositories/watched",
      )
      expect(watchedRes.status).toBe(200)
      const watchedData = await watchedRes.json()
      expect(watchedData).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: {
          page: expect.any(Number),
          perPage: expect.any(Number),
          total: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrev: expect.any(Boolean),
        },
      })

      // その他のエンドポイント（GitHubページネーション）
      const githubPaginationEndpoints = [
        "/api/datasource/repositories/owner/repo/releases",
        "/api/datasource/repositories/owner/repo/pulls",
        "/api/datasource/repositories/owner/repo/issues",
      ]

      // 複数のエンドポイントでページネーション形式の一貫性を確認するため、
      // 各エンドポイントごとに個別のアサーションが必要
      for (const endpoint of githubPaginationEndpoints) {
        const res = await app.request(endpoint)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data).toMatchObject({
          success: true,
          data: expect.any(Array),
          meta: {
            page: expect.any(Number),
            perPage: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrev: expect.any(Boolean),
            // totalはGitHubページネーションにはない
          },
        })
      }

      // 詳細エンドポイントのテスト（metaなし）
      const detailRes = await app.request(
        "/api/datasource/repositories/owner/repo",
      )
      expect(detailRes.status).toBe(200)
      const detailData = await detailRes.json()
      expect(detailData).toMatchObject({
        success: true,
        data: expect.any(Object),
        // 詳細エンドポイントにはmetaなし
      })
    })

    test("エラーレスポンス形式の一貫性", async () => {
      const errorTypes = [
        {
          error: new GitHubApiError("Not found", 404),
          expectedCode: "GITHUB_API_ERROR",
          expectedStatus: 404,
        },
        {
          error: new GitHubAuthenticationError("Auth failed"),
          expectedCode: "GITHUB_AUTH_ERROR",
          expectedStatus: 401,
        },
        {
          error: new Error("Generic error"),
          expectedCode: "INTERNAL_ERROR",
          expectedStatus: 500,
        },
      ]

      // 複数のエラータイプでレスポンス形式の一貫性を確認するため、
      // 各エラータイプごとに個別のアサーションが必要
      for (const { error, expectedCode, expectedStatus } of errorTypes) {
        githubServiceStub.clearErrors() // 前のエラーをクリア
        githubServiceStub.setWatchedRepositoriesError(error)

        const res = await app.request("/api/datasource/repositories/watched")
        expect(res.status).toBe(expectedStatus)

        const data = await res.json()
        expect(data).toMatchObject({
          success: false,
          error: {
            code: expectedCode,
            message: expect.any(String),
          },
        })
      }
    })
  })
})
