/**
 * Authentication Types
 *
 * JWT認証とAuth0統合に関する型定義
 */

export interface JWTPayload {
  /** Issuer - Auth0ドメイン */
  iss: string
  /** Subject - ユーザーID */
  sub: string
  /** Audience - APIのAudience */
  aud: string | string[]
  /** Issued At - 発行時刻 */
  iat: number
  /** Expiration Time - 有効期限 */
  exp: number
  /** Not Before - 有効開始時刻 */
  nbf?: number
  /** Authorized Party - 認可されたパーティ */
  azp?: string
  /** Scope - スコープ */
  scope?: string
  /** Email address - メールアドレス */
  email?: string
  /** Name - ユーザー名 */
  name?: string
  /** Picture - プロフィール画像URL */
  picture?: string
  /** Nickname - ニックネーム（GitHubユーザー名など） */
  nickname?: string
  /** Preferred username - 優先ユーザー名 */
  preferred_username?: string
  /** Custom claims */
  [key: string]: unknown
}

export interface Auth0Config {
  /** Auth0ドメイン */
  domain: string
  /** Auth0 Audience (API Identifier) */
  audience: string
  /** 発行者URL */
  issuer: string
  /** JWKS URI */
  jwksUri: string
  /** 許可されるアルゴリズム */
  algorithms: string[]
}

export interface AuthenticatedUser {
  /** Auth0のsub (ユーザーID) */
  sub: string
  /** JWTペイロード全体 */
  payload: JWTPayload
  /** アクセストークン */
  accessToken: string
}

export interface TokenValidationResult {
  /** バリデーション結果 */
  valid: boolean
  /** デコードされたペイロード */
  payload?: JWTPayload
  /** エラー情報 */
  error?: string
}

export interface AuthContext {
  /** 認証済みユーザー情報 */
  user: AuthenticatedUser
}

/**
 * Honoのコンテキストに追加される認証情報の型
 */
declare module "hono" {
  interface ContextVariableMap {
    auth?: AuthContext
  }
}
