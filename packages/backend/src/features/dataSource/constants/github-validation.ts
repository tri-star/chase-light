/**
 * DataSource機能固有のGitHub制約定数
 */

/**
 * GitHubユーザー名制約
 *
 * GitHub公式制限に基づく
 * 参考: https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-personal-account-settings/changing-your-github-username
 * - 英数字とハイフンのみ許可
 * - 最初と最後はアルファベットまたは数字
 * - 連続するハイフンは禁止
 * - 最大39文字（GitHubの内部制限）
 */
export const GITHUB_USERNAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 39, // GitHub内部制限：ユーザー名/組織名は39文字まで
  PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
  ERROR_MESSAGE: "有効なGitHubユーザー名を指定してください",
} as const

/**
 * GitHubリポジトリ名制約
 *
 * GitHub公式制限に基づく
 * 参考: https://docs.github.com/en/repositories/creating-and-managing-repositories/naming-a-repository
 * - 英数字、ピリオド、ハイフン、アンダースコアのみ許可
 * - 最大100文字
 */
export const GITHUB_REPOSITORY = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100, // GitHub公式制限：リポジトリ名は100文字まで
  PATTERN: /^[a-zA-Z0-9._-]+$/,
  ERROR_MESSAGE: "有効なGitHubリポジトリ名を指定してください",
} as const

/**
 * ページネーション制約
 *
 * GitHub API仕様に準拠
 * 参考: https://docs.github.com/en/rest/guides/using-pagination-in-the-rest-api
 */
export const PAGINATION = {
  MIN_PAGE: 1,
  MAX_PAGE: 100, // GitHub API実質制限
  MIN_PER_PAGE: 1,
  MAX_PER_PAGE: 100, // GitHub API最大値
  DEFAULT_PER_PAGE: 30, // GitHub APIデフォルト値
} as const
