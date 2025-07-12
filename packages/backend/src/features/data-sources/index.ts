import {
  DataSourceRepository,
  RepositoryRepository,
  UserWatchRepository,
} from "./repositories"
import { UserRepository } from "../user/repositories/user.repository"
import { DataSourceCreationService, DataSourceListService, DataSourceDetailService } from "./services"
import { createDataSourcePresentationRoutes } from "./presentation"

/**
 * Data Sources Presentation Layer Entry Point
 * データソース管理API プレゼンテーション層のエントリーポイント
 *
 * 依存性注入によりサービス層との結合を行う
 */

// リポジトリのインスタンス作成
const dataSourceRepository = new DataSourceRepository()
const repositoryRepository = new RepositoryRepository()
const userWatchRepository = new UserWatchRepository()
const userRepository = new UserRepository()

// サービスの依存性注入
const dataSourceCreationService = new DataSourceCreationService(
  dataSourceRepository,
  repositoryRepository,
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

// 依存性を注入してルーターを構築
const dataSourceRoutes = createDataSourcePresentationRoutes(
  dataSourceCreationService,
  dataSourceListService,
  dataSourceDetailService,
)

export default dataSourceRoutes

// ファクトリー関数もエクスポート（テスト用）
export { createDataSourcePresentationRoutes } from "./presentation"

// ドメイン型とエラークラスをエクスポート
export * from "./domain"
export * from "./services"
export * from "./presentation/shared/error-handling"
