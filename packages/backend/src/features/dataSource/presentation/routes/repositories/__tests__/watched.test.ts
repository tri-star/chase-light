import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createWatchedRepositoriesRoute } from "../watched"
import { GitHubRepoServiceStub } from "../../../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../../../services/__tests__/test-data-builder"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../../../../errors/github-api.error"

describe("Watched Repositories Route", () => {
  let app: OpenAPIHono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new OpenAPIHono()
    createWatchedRepositoriesRoute(app, githubServiceStub)
  })

  describe("GET /repositories/watched", () => {
    test("正常なリクエストで認証ユーザーのwatch済みリポジトリ一覧を返す", async () => {
      const mockRepositories = [
        TestDataBuilder.createRepository(),
        TestDataBuilder.createRepository({
          name: "test-repo-2",
          fullName: "testuser/test-repo-2",
        }),
      ]
      githubServiceStub.setWatchedRepositories(mockRepositories)

      const res = await app.request("/repositories/watched")

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

      const res = await app.request("/repositories/watched?page=2&perPage=10")

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

    test("不正なページ番号でバリデーションエラーを返す", async () => {
      const res = await app.request("/repositories/watched?page=0")

      expect(res.status).toBe(400)
    })

    test("存在しないユーザーで404エラーを返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new GitHubApiError("User not found", 404),
      )

      const res = await app.request("/repositories/watched")

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_API_ERROR")
    })

    test("GitHubAuthenticationErrorで401を返す", async () => {
      githubServiceStub.setErrorForMethod(
        "getWatchedRepositories",
        new GitHubAuthenticationError(),
      )

      const res = await app.request("/repositories/watched")

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

      const res = await app.request("/repositories/watched")

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

      const res = await app.request("/repositories/watched")

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("INTERNAL_ERROR")
    })

    test.each([
      [0, "ページ番号は1以上である必要があります"],
      [101, "ページ番号は100以下である必要があります"],
    ])(
      "不正なページ番号 %i でバリデーションエラーを返す",
      async (page, _expectedError) => {
        const res = await app.request(`/repositories/watched?page=${page}`)

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
          `/repositories/watched?perPage=${perPage}`,
        )

        expect(res.status).toBe(400)
      },
    )
  })
})
