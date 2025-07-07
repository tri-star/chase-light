/**
 * Authentication Path Exclusions
 *
 * JWT認証から除外するパスの管理
 */

export interface AuthExclusionConfig {
  /** 除外する完全パス */
  exactPaths?: string[]
  /** 除外するパス前置詞 */
  pathPrefixes?: string[]
  /** 除外するパターン（正規表現） */
  patterns?: RegExp[]
}

/**
 * デフォルトの認証除外設定
 */
export const DEFAULT_AUTH_EXCLUSIONS: AuthExclusionConfig = {
  exactPaths: [
    "/health",
    "/doc",
    "/scalar",
    "/api/auth/signup", // ユーザー登録のみ認証除外
  ],
  pathPrefixes: [
    "/api/public/", // パブリックAPI
  ],
  patterns: [
    /^\/static\/.*/, // 静的ファイル
    /^\/assets\/.*/, // アセットファイル
  ],
}

/**
 * パスが認証除外対象かどうかを判定
 */
export function isPathExcluded(
  path: string,
  config: AuthExclusionConfig = DEFAULT_AUTH_EXCLUSIONS,
): boolean {
  // 完全パスマッチ
  if (config.exactPaths?.includes(path)) {
    return true
  }

  // 前置詞マッチ
  if (config.pathPrefixes?.some((prefix) => path.startsWith(prefix))) {
    return true
  }

  // 正規表現パターンマッチ
  if (config.patterns?.some((pattern) => pattern.test(path))) {
    return true
  }

  return false
}

/**
 * 環境変数から認証除外設定を取得
 */
export function getAuthExclusionsFromEnv(): AuthExclusionConfig {
  const config: AuthExclusionConfig = { ...DEFAULT_AUTH_EXCLUSIONS }

  // 環境変数からの追加除外パス
  const envExclusions = process.env.AUTH_EXCLUDE_PATHS
  if (envExclusions) {
    const additionalPaths = envExclusions.split(",").map((p) => p.trim())
    config.exactPaths = [...(config.exactPaths || []), ...additionalPaths]
  }

  return config
}

