import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createRepositoryDetailsRoute } from "../detail"
import { GitHubRepoServiceStub } from "../../../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../../../services/__tests__/test-data-builder"
import { GitHubApiError } from "../../../../errors/github-api.error"

describe("Repository Details Route", () => {
  let app: OpenAPIHono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new OpenAPIHono()
    createRepositoryDetailsRoute(app, githubServiceStub)
  })

  describe("GET /repositories/:owner/:repo", () => {
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

      const res = await app.request("/repositories/testowner/testrepo")

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

      const res = await app.request("/repositories/testowner/nonexistent")

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe("GITHUB_API_ERROR")
    })

    test("不正なリポジトリ名でバリデーションエラーを返す", async () => {
      const res = await app.request("/repositories/testowner/invalid repo name")

      expect(res.status).toBe(400)
    })
  })
})
