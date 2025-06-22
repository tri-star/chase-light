import { describe, test, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { createDataSourceRoutes } from "../routes"
import { GitHubRepoServiceStub } from "../../services/__tests__/github-repo.service.stub"
import { TestDataBuilder } from "../../services/__tests__/test-data-builder"

describe("DataSource Routes Integration", () => {
  let app: Hono
  let githubServiceStub: GitHubRepoServiceStub

  beforeEach(() => {
    githubServiceStub = new GitHubRepoServiceStub()
    app = new Hono().route(
      "/api/datasource",
      createDataSourceRoutes(githubServiceStub),
    )
  })

  test("統合ルーターが全エンドポイントを正しく統合している", async () => {
    // watchedリポジトリエンドポイントのテスト
    const mockRepositories = [TestDataBuilder.createRepository()]
    githubServiceStub.setWatchedRepositories(mockRepositories)

    const watchedRes = await app.request("/api/datasource/repositories/watched")
    expect(watchedRes.status).toBe(200)

    // repositoryエンドポイントのテスト
    const mockRepository = TestDataBuilder.createRepository()
    githubServiceStub.setRepositoryDetails("owner", "repo", mockRepository)

    const repoRes = await app.request("/api/datasource/repositories/owner/repo")
    expect(repoRes.status).toBe(200)

    // releasesエンドポイントのテスト
    const mockReleases = [TestDataBuilder.createRelease()]
    githubServiceStub.setRepositoryReleases("owner", "repo", mockReleases)

    const releasesRes = await app.request(
      "/api/datasource/repositories/owner/repo/releases",
    )
    expect(releasesRes.status).toBe(200)

    // pullsエンドポイントのテスト
    const mockPulls = [TestDataBuilder.createPullRequest()]
    githubServiceStub.setRepositoryPullRequests("owner", "repo", mockPulls)

    const pullsRes = await app.request(
      "/api/datasource/repositories/owner/repo/pulls",
    )
    expect(pullsRes.status).toBe(200)

    // issuesエンドポイントのテスト
    const mockIssues = [TestDataBuilder.createIssue()]
    githubServiceStub.setRepositoryIssues("owner", "repo", mockIssues)

    const issuesRes = await app.request(
      "/api/datasource/repositories/owner/repo/issues",
    )
    expect(issuesRes.status).toBe(200)
  })
})
