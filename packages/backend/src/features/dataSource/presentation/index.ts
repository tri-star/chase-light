import createDataSourceRoutes from "./routes"
import { getGitHubRepoService } from "../services"

/**
 * DataSource Presentation Layer - Integration
 * プレゼンテーション層の統合とルート提供
 */

/**
 * DataSource routes with dependency injection
 * 依存性注入されたサービスを使用してルートを生成
 */
const dataSourceRoutes = createDataSourceRoutes(getGitHubRepoService())

export default dataSourceRoutes
export { createDataSourceRoutes } from "./routes"
export { dataSourceSchemas } from "./schemas"
export type {
  UsernameParams,
  RepositoryParams,
  BasicPaginationQuery,
  PullRequestQuery,
  IssueQuery,
} from "./schemas"
