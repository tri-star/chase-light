import { OpenAPIHono } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../services/github-repo.service.interface"
import { createWatchedRepositoriesRoute } from "./routes/repositories/watched"
import { createRepositoryDetailsRoute } from "./routes/repositories/detail"
import { createReleasesRoute } from "./routes/releases"
import { createPullRequestsRoute } from "./routes/pull-requests"
import { createIssuesRoute } from "./routes/issues"

/**
 * DataSource Routes (GitHub API Integration)
 * GitHub データソース関連のAPIエンドポイント統合ルーター
 */
export const createDataSourceRoutes = (githubService: IGitHubRepoService) => {
  const app = new OpenAPIHono()

  // 各エンドポイントルートを統合
  createWatchedRepositoriesRoute(app, githubService)
  createRepositoryDetailsRoute(app, githubService)
  createReleasesRoute(app, githubService)
  createPullRequestsRoute(app, githubService)
  createIssuesRoute(app, githubService)

  return app
}

export default createDataSourceRoutes
