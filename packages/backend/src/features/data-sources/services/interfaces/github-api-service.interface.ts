/**
 * GitHub API レスポンスの型定義
 */
export type GitHubRepositoryResponse = {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  private: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  fork: boolean
}

/**
 * GitHub API サービスのインターフェース
 * 実装とスタブの両方でこのインターフェースを使用
 */
export interface GitHubApiServiceInterface {
  /**
   * リポジトリ情報を取得
   */
  getRepository(owner: string, repo: string): Promise<GitHubRepositoryResponse>
}
