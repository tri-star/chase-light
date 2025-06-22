import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createPullRequestsRoute } from "../index"
import { GitHubRepoServiceStub } from "../../../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../../../services/__tests__/test-data-builder"

describe("Pull Requests Route", () => {
  let app: OpenAPIHono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new OpenAPIHono()
    createPullRequestsRoute(app, githubServiceStub)
  })

  describe("GET /repositories/:owner/:repo/pulls", () => {
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

      const res = await app.request("/repositories/testowner/testrepo/pulls")

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
        "/repositories/testowner/testrepo/pulls?state=closed&sort=updated&direction=asc",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockPulls)
    })

    test("不正な状態パラメータでバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/repositories/testowner/testrepo/pulls?state=invalid",
      )

      expect(res.status).toBe(400)
    })
  })
})
