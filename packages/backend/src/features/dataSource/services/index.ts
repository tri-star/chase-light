import { GitHubRepoService } from "./github-repo.service"
import type { IGitHubRepoService } from "./github-repo.service.interface"

/**
 * DataSource Services - Dependency Injection Setup
 * データソースサービスの依存性注入とインスタンス管理
 */

/**
 * GitHub Repository Service インスタンスの作成
 * 環境変数からトークンを取得して本番用サービスを初期化
 */
export const createGitHubRepoService = (): IGitHubRepoService => {
  const githubToken = process.env.GITHUB_TOKEN

  if (!githubToken) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required for GitHub API access",
    )
  }

  return new GitHubRepoService(githubToken)
}

/**
 * デフォルトサービスインスタンス
 * アプリケーション起動時に初期化される
 */
let defaultGitHubService: IGitHubRepoService | null = null

export const getGitHubRepoService = (): IGitHubRepoService => {
  if (!defaultGitHubService) {
    defaultGitHubService = createGitHubRepoService()
  }
  return defaultGitHubService
}

/**
 * テスト環境用のサービス設定
 * テスト時に mock や stub を注入可能
 */
export const setGitHubRepoService = (service: IGitHubRepoService): void => {
  defaultGitHubService = service
}

/**
 * サービスインスタンスをリセット
 * 主にテスト後のクリーンアップで使用
 */
export const resetGitHubRepoService = (): void => {
  defaultGitHubService = null
}

// 型定義のエクスポート
export type { IGitHubRepoService } from "./github-repo.service.interface"
export { GitHubRepoService } from "./github-repo.service"
