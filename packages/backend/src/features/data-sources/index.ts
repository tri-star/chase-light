import { DataSourceRepository, UserWatchRepository } from "./repositories"
import { UserRepository } from "../user/repositories/user.repository"
import {
  DataSourceCreationService,
  DataSourceWatchService,
  DataSourceListService,
  DataSourceDetailService,
  DataSourceUpdateService,
  DataSourceDeletionService,
} from "./services"
import { createGitHubApiService } from "./services/github-api-service.factory"
import { createDataSourcePresentationRoutes } from "./presentation"

/**
 * Data Sources Presentation Layer Entry Point
 * データソース管理API プレゼンテーション層のエントリーポイント
 *
 * 依存性注入によりサービス層との結合を行う
 */

// リポジトリのインスタンス作成
const dataSourceRepository = new DataSourceRepository()
const userWatchRepository = new UserWatchRepository()
const userRepository = new UserRepository()

// GitHubApiServiceを作成
const githubApiService = createGitHubApiService()

// サービスの依存性注入
const dataSourceCreationService = new DataSourceCreationService(
  dataSourceRepository,
  githubApiService,
)

const dataSourceWatchService = new DataSourceWatchService(
  dataSourceCreationService,
  userWatchRepository,
  userRepository,
)

const dataSourceListService = new DataSourceListService(
  dataSourceRepository,
  userRepository,
)

const dataSourceDetailService = new DataSourceDetailService(
  dataSourceRepository,
  userRepository,
)

const dataSourceUpdateService = new DataSourceUpdateService(
  dataSourceRepository,
  userWatchRepository,
  userRepository,
)

const dataSourceDeletionService = new DataSourceDeletionService(
  dataSourceRepository,
  userRepository,
)

// 依存性を注入してルーターを構築
const dataSourceRoutes = createDataSourcePresentationRoutes(
  dataSourceWatchService,
  dataSourceListService,
  dataSourceDetailService,
  dataSourceUpdateService,
  dataSourceDeletionService,
)

export default dataSourceRoutes

// ファクトリー関数もエクスポート（テスト用）
export { createDataSourcePresentationRoutes } from "./presentation"

// ドメイン型とエラークラスをエクスポート
export * from "./domain"
export * from "./services"
export * from "./presentation/shared/error-handling"
