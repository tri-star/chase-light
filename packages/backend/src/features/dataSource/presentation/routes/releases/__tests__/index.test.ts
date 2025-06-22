import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createReleasesRoute } from "../index"
import { GitHubRepoServiceStub } from "../../../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../../../services/__tests__/test-data-builder"

describe("Releases Route", () => {
  let app: OpenAPIHono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new OpenAPIHono()
    createReleasesRoute(app, githubServiceStub)
  })

  describe("GET /repositories/:owner/:repo/releases", () => {
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

      const res = await app.request("/repositories/testowner/testrepo/releases")

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
        "/repositories/testowner/testrepo/releases?page=1&perPage=5",
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(5)
      expect(json.meta.hasNext).toBe(true) // perPageと同じ数の場合はhasNext=true
    })
  })
})
