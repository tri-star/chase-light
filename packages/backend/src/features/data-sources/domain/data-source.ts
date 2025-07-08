/**
 * データソースのドメイン型定義
 * GitHubリポジトリやNPMパッケージなど、各種データソースを抽象化した型
 */
export type DataSource = {
  id: string
  sourceType: string
  sourceId: string
  name: string
  description: string
  url: string
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * データソース作成時の入力型
 */
export type DataSourceCreationInput = {
  sourceType: string
  sourceId: string
  name: string
  description: string
  url: string
  isPrivate: boolean
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
