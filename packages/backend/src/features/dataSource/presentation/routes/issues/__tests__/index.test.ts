import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createIssuesRoute } from "../index"
import { GitHubRepoServiceStub } from "../../../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../../../services/__tests__/test-data-builder"

describe("Issues Route", () => {
  let app: OpenAPIHono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new OpenAPIHono()
    createIssuesRoute(app, githubServiceStub)
  })

  describe("GET /repositories/:owner/:repo/issues", () => {
    test("正常なリクエストでIssue一覧を返す", async () => {
      const mockIssues = [
        TestDataBuilder.createIssue(),
        TestDataBuilder.createIssue({ number: 2, title: "Second Issue" }),
      ]
      githubServiceStub.setRepositoryIssues("testowner", "testrepo", mockIssues)

      const res = await app.request("/repositories/testowner/testrepo/issues")

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
        "/repositories/testowner/testrepo/issues?since=2023-01-01T00:00:00Z",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    test("不正なsince日付でバリデーションエラーを返す", async () => {
      const res = await app.request(
        "/repositories/testowner/testrepo/issues?since=invalid-date",
      )

      expect(res.status).toBe(400)
    })
  })
})
