import { describe, test, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { createDataSourceRoutes } from "../routes"
import { GitHubRepoServiceStub } from "../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../services/__tests__/test-data-builder"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../../errors/github-api.error"

describe("DataSource Routes", () => {
  let app: Hono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new Hono().route(
      "/api/datasource",
      createDataSourceRoutes(githubServiceStub),
    )
  })

  describe("GET /api/datasource/repositories/watched/:username", () => {
    test("正常なリクエストでユーザーのwatch済みリポジトリ一覧を返す", async () => {
      const mockRepositories = [
        TestDataBuilder.createRepository(),
        TestDataBuilder.createRepository({
          name: "test-repo-2",
          fullName: "testuser/test-repo-2",
        }),
      ]
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const res = await app.request(
        "/api/datasource/repositories/watched/testuser",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        success: true,
        data: mockRepositories,
        meta: {
          page: 1,
          perPage: 30,
          total: 2,
          hasNext: false,
          hasPrev: false,
        },
      })
    })

    test("ページングパラメータを正しく処理する", async () => {
      const mockRepositories = Array.from({ length: 50 }, (_, i) =>
        TestDataBuilder.createRepository({
          name: `repo-${i + 1}`,
          fullName: `testuser/repo-${i + 1}`,
          id: i + 1,
        }),
      )
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const res = await app.request(
        "/api/datasource/repositories/watched/testuser?page=2&perPage=10",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(10)
      expect(json.meta).toEqual({
        page: 2,
        perPage: 10,
        total: 50,
        hasNext: true,
        hasPrev: true,
      })
      expect(json.data[0].name).toBe("repo-11") // 2ページ目の最初
    })

    test("不正なユーザー名でバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/api/datasource/repositories/watched/invalid-user-name!",
      )

      expect(res.status).toBe(400)
    })

    test("存在しないユーザーで404エラーを返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new GitHubApiError("User not found", 404),
      )

      const res = await app.request(
        "/api/datasource/repositories/watched/nonexistentuser",
      )

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_API_ERROR")
    })
  })

  describe("GET /api/datasource/repositories/:owner/:repo", () => {
    test("正常なリクエストでリポジトリ詳細を返す", async () => {
      const mockRepository = TestDataBuilder.createRepository({
        name: "testrepo",
        fullName: "testowner/testrepo",
        owner: TestDataBuilder.createRepositoryOwner({ login: "testowner" }),
      })
      githubServiceStub.setRepositoryDetails(
        "testowner",
        "testrepo",
        mockRepository,
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        success: true,
        data: mockRepository,
      })
    })

    test("存在しないリポジトリで404エラーを返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getRepositoryDetails",
        new GitHubApiError("Repository not found", 404),
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/nonexistent",
      )

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_API_ERROR")
    })

    test("不正なリポジトリ名でバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/api/datasource/repositories/testowner/invalid repo name",
      )

      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/datasource/repositories/:owner/:repo/releases", () => {
    test("正常なリクエストでリリース一覧を返す", async () => {
      const mockReleases = [
        TestDataBuilder.createRelease(),
        TestDataBuilder.createRelease({
          tagName: "v2.0.0",
          name: "Release v2.0.0",
        }),
      ]
      githubServiceStub.setRepositoryReleases(
        "testowner",
        "testrepo",
        mockReleases,
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/releases",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        success: true,
        data: mockReleases,
        meta: {
          page: 1,
          perPage: 30,
          hasNext: false,
          hasPrev: false,
        },
      })
    })

    test("ページングパラメータを正しく処理する", async () => {
      const mockReleases = Array.from({ length: 5 }, (_, i) =>
        TestDataBuilder.createRelease({
          id: i + 1,
          tagName: `v1.${i}.0`,
        }),
      )
      githubServiceStub.setRepositoryReleases(
        "testowner",
        "testrepo",
        mockReleases,
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/releases?page=1&perPage=5",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(5)
      expect(json.meta.hasNext).toBe(true) // perPageと同じ数の場合はhasNext=true
    })
  })

  describe("GET /api/datasource/repositories/:owner/:repo/pulls", () => {
    test("正常なリクエストでPull Request一覧を返す", async () => {
      const mockPulls = [
        TestDataBuilder.createPullRequest(),
        TestDataBuilder.createPullRequest({ number: 2, title: "Second PR" }),
      ]
      githubServiceStub.setRepositoryPullRequests(
        "testowner",
        "testrepo",
        mockPulls,
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/pulls",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        success: true,
        data: mockPulls,
        meta: {
          page: 1,
          perPage: 30,
          hasNext: false,
          hasPrev: false,
        },
      })
    })

    test("状態フィルターとソートパラメータを正しく処理する", async () => {
      const mockPulls = [TestDataBuilder.createPullRequest({ state: "closed" })]
      githubServiceStub.setRepositoryPullRequests(
        "testowner",
        "testrepo",
        mockPulls,
      )

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/pulls?state=closed&sort=updated&direction=asc",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockPulls)
    })

    test("不正な状態パラメータでバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/pulls?state=invalid",
      )

      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/datasource/repositories/:owner/:repo/issues", () => {
    test("正常なリクエストでIssue一覧を返す", async () => {
      const mockIssues = [
        TestDataBuilder.createIssue(),
        TestDataBuilder.createIssue({ number: 2, title: "Second Issue" }),
      ]
      githubServiceStub.setRepositoryIssues("testowner", "testrepo", mockIssues)

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/issues",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        success: true,
        data: mockIssues,
        meta: {
          page: 1,
          perPage: 30,
          hasNext: false,
          hasPrev: false,
        },
      })
    })

    test("since日付パラメータを正しく処理する", async () => {
      const mockIssues = [TestDataBuilder.createIssue()]
      githubServiceStub.setRepositoryIssues("testowner", "testrepo", mockIssues)

      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/issues?since=2023-01-01T00:00:00Z",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    test("不正なsince日付でバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/api/datasource/repositories/testowner/testrepo/issues?since=invalid-date",
      )

      expect(res.status).toBe(400)
    })
  })

  describe("エラーハンドリング", () => {
    test("GitHubAuthenticationErrorで401を返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new GitHubAuthenticationError(),
      )

      const res = await app.request(
        "/api/datasource/repositories/watched/testuser",
      )

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_AUTH_ERROR")
    })

    test("GitHubRateLimitErrorで429を返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new GitHubRateLimitError(
          "Rate limit exceeded",
          new Date(Date.now() + 3600000),
          0,
        ),
      )

      const res = await app.request(
        "/api/datasource/repositories/watched/testuser",
      )

      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_RATE_LIMIT")
      expect(json.error.details).toHaveProperty("resetTime")
      expect(json.error.details).toHaveProperty("remaining")
    })

    test("予期しないエラーで500を返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new Error("Unexpected error"),
      )

      const res = await app.request(
        "/api/datasource/repositories/watched/testuser",
      )

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("INTERNAL_ERROR")
    })
  })

  describe("境界値テスト", () => {
    test.each([
      [0, "ページ番号は1以上である必要があります"],
      [101, "ページ番号は100以下である必要があります"],
    ])(
      "不正なページ番号 %i でバリデーションエラーを返す",
      async (page, _expectedError) => {
        const res = await app.request(
          `/api/datasource/repositories/watched/testuser?page=${page}`,
        )

        expect(res.status).toBe(400)
      },
    )

    test.each([
      [0, "1ページあたりの件数は1から100の間で指定してください"],
      [101, "1ページあたりの件数は1から100の間で指定してください"],
    ])(
      "不正なperPage値 %i でバリデーションエラーを返す",
      async (perPage, _expectedError) => {
        const res = await app.request(
          `/api/datasource/repositories/watched/testuser?perPage=${perPage}`,
        )

        expect(res.status).toBe(400)
      },
    )
  })
})
