/**
 * GitHubリポジトリのドメイン型定義
 * データソースと1対1の関係を持つ
 */
export type Repository = {
  id: string
  dataSourceId: string
  githubId: number
  fullName: string
  language: string | null
  starsCount: number
  forksCount: number
  openIssuesCount: number
  isFork: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * リポジトリ作成時の入力型
 */
export type RepositoryCreationInput = {
  dataSourceId: string
  githubId: number
  fullName: string
  language: string | null
  starsCount: number
  forksCount: number
  openIssuesCount: number
  isFork: boolean
}
