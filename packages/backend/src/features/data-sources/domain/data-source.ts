/**
 * GitHubリポジトリのドメイン型定義（repository.tsから統合）
 * dataSourceIdフィールドを削除してDataSource内包形式にする
 */
export type Repository = {
  id: string
  githubId: number
  fullName: string
  owner: string
  language: string | null
  starsCount: number
  forksCount: number
  openIssuesCount: number
  isFork: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * リポジトリ作成時の入力型（repository.tsから統合）
 * dataSourceIdフィールドを削除
 */
export type RepositoryCreationInput = {
  id?: string
  githubId: number
  fullName: string
  language: string | null
  starsCount: number
  forksCount: number
  openIssuesCount: number
  isFork: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * GitHubデータソースの型定義（Discriminated Union）
 * repositoryフィールドを内包してより一貫したデータ構造を提供
 */
export type GitHubDataSource = {
  id: string
  sourceType: "github"
  sourceId: string
  name: string
  description: string
  url: string
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
  repository: Repository
}

/**
 * データソースのDiscriminated Union
 * 将来的にNPMDataSource等を追加予定
 */
export type DataSource = GitHubDataSource

/**
 * GitHubデータソース作成時の入力型
 */
export type GitHubDataSourceCreationInput = {
  id?: string
  sourceType: "github"
  sourceId: string
  name: string
  description: string
  url: string
  isPrivate: boolean
  repository: RepositoryCreationInput
}

/**
 * データソース作成時の入力型（Discriminated Union）
 */
export type DataSourceCreationInput = GitHubDataSourceCreationInput

/**
 * データソース更新時の入力型
 */
export type DataSourceUpdateInput = {
  name?: string
  description?: string
}

/**
 * データソースのソースタイプ定数
 */
export const DATA_SOURCE_TYPES = {
  GITHUB: "github",
  NPM: "npm", // 将来対応予定
} as const

export type DataSourceType =
  (typeof DATA_SOURCE_TYPES)[keyof typeof DATA_SOURCE_TYPES]

/**
 * 型ガード関数: GitHubDataSourceかどうかを判定
 */
export function isGitHubDataSource(
  dataSource: DataSource,
): dataSource is GitHubDataSource {
  return dataSource.sourceType === "github"
}
