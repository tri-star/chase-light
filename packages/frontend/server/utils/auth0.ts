import jwt from 'jsonwebtoken'
import type {
  JwtHeader,
  SigningKeyCallback,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { getAppRuntimeConfig, getRequiredSecretValue } from './secrets'

/**
 * Auth0ユーティリティ
 *
 * 環境変数設定：
 * - AUTH_LOG_LEVEL: ログレベル (error/warn/info/debug) - デフォルト: info
 * - AUTH_DEBUG_SENSITIVE: センシティブ情報のログ出力 (true/false) - デフォルト: false
 *   ※本番環境では自動的に無効になります
 *
 * デバッグ時の推奨設定：
 * - 開発環境: AUTH_LOG_LEVEL=debug
 * - トラブルシューティング: AUTH_LOG_LEVEL=debug AUTH_DEBUG_SENSITIVE=true
 */

/**
 * Auth0設定を取得する
 */
async function getAuth0Config() {
  const config = getAppRuntimeConfig()
  const [domain, clientId, clientSecret, audience] = await Promise.all([
    getRequiredSecretValue('AUTH0_DOMAIN'),
    getRequiredSecretValue('AUTH0_CLIENT_ID'),
    getRequiredSecretValue('AUTH0_CLIENT_SECRET'),
    getRequiredSecretValue('AUTH0_AUDIENCE'),
  ])

  return {
    domain,
    clientId,
    clientSecret,
    audience,
    scope: 'openid profile email offline_access',
    redirectUri: `${config.public.baseUrl}/api/auth/callback`,
  }
}

type Auth0ConfigResolved = Awaited<ReturnType<typeof getAuth0Config>>

/**
 * デバッグログの設定を取得する
 */
function getDebugLogConfig() {
  return {
    // 本番環境以外でのみ詳細ログを有効にする
    isDetailedLoggingEnabled: process.env.NODE_ENV !== 'production',
    // ログレベル設定（環境変数で制御）
    logLevel: (process.env.AUTH_LOG_LEVEL || 'info').toLowerCase(),
    // センシティブ情報のログ出力制御
    enableSensitiveLogging:
      process.env.AUTH_DEBUG_SENSITIVE === 'true' &&
      process.env.NODE_ENV !== 'production',
  }
}

/**
 * トークンの一部をマスクする（デバッグ用）
 */
const MIN_TOKEN_LENGTH_FOR_MASKING = 20 // Minimum token length required for masking logic
function maskToken(token: string): string {
  if (!token || token.length < MIN_TOKEN_LENGTH_FOR_MASKING) {
    return '***'
  }
  // JWT形式の場合は各部分の最初と最後を少し表示
  const parts = token.split('.')
  if (parts.length === 3) {
    return parts
      .map((part) =>
        part.length > 8 ? `${part.slice(0, 4)}...${part.slice(-4)}` : '***'
      )
      .join('.')
  }
  // 通常のトークンの場合
  return `${token.slice(0, 8)}...${token.slice(-8)}`
}

/**
 * JWTトークンのペイロードを安全にデバッグ表示する
 */
function getTokenDebugInfo(token: string): object {
  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string') {
      return { error: 'Unable to decode token' }
    }

    const { header, payload } = decoded

    // payloadがstringの場合の処理
    if (typeof payload === 'string') {
      return {
        header: {
          alg: header.alg,
          typ: header.typ,
          kid: header.kid ? `${header.kid.slice(0, 8)}...` : undefined,
        },
        payload: { type: 'string', length: payload.length },
      }
    }

    return {
      header: {
        alg: header.alg,
        typ: header.typ,
        kid: header.kid ? `${header.kid.slice(0, 8)}...` : undefined,
      },
      payload: {
        iss: payload.iss,
        aud: Array.isArray(payload.aud)
          ? payload.aud
          : payload.aud
            ? [payload.aud]
            : undefined,
        sub:
          payload.sub && typeof payload.sub === 'string'
            ? `${payload.sub.slice(0, 8)}...`
            : undefined,
        exp: payload.exp
          ? new Date(payload.exp * 1000).toISOString()
          : undefined,
        iat: payload.iat
          ? new Date(payload.iat * 1000).toISOString()
          : undefined,
        nbf: payload.nbf
          ? new Date(payload.nbf * 1000).toISOString()
          : undefined,
      },
    }
  } catch (_err) {
    return { error: 'Failed to decode token for debug info' }
  }
}

/**
 * セキュアなログ出力機能
 */
function secureLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>,
  token?: string
) {
  const debugConfig = getDebugLogConfig()

  // ログレベルチェック
  const levels = { error: 0, warn: 1, info: 2, debug: 3 }
  const currentLevel = levels[debugConfig.logLevel as keyof typeof levels] ?? 2
  const messageLevel = levels[level]

  if (messageLevel > currentLevel) {
    return
  }

  const logData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }

  // 詳細ログが有効かつトークンが提供されている場合
  if (debugConfig.isDetailedLoggingEnabled && token) {
    if (debugConfig.enableSensitiveLogging) {
      // センシティブログが有効な場合：マスクされたトークンを含める
      logData.tokenMasked = maskToken(token)
    }

    // トークンのデバッグ情報を常に含める（センシティブ情報は除く）
    logData.tokenDebugInfo = getTokenDebugInfo(token)
  }

  // 環境に応じたログ出力
  if (level === 'error') {
    console.error('AUTH_ERROR:', logData)
  } else if (level === 'warn') {
    console.warn('AUTH_WARN:', logData)
  } else if (level === 'debug' && debugConfig.isDetailedLoggingEnabled) {
    console.debug('AUTH_DEBUG:', logData)
  } else {
    console.log('AUTH_INFO:', logData)
  }
}

// Auth0ユーザー情報の型定義
export interface Auth0User {
  sub: string
  email: string
  email_verified: boolean
  name: string
  nickname: string
  picture: string
  updated_at: string
  [key: string]: unknown
}

// トークン検証エラーの型定義
export type TokenValidationErrorCode =
  | 'token_expired'
  | 'invalid_signature'
  | 'invalid_audience'
  | 'invalid_issuer'
  | 'malformed_token'
  | 'missing_claims'
  | 'invalid_algorithm'
  | 'token_not_active'
  | 'validation_error'

// 型安全なエラーコード定数を定義
export const ERROR_CODES = {
  TOKEN_EXPIRED: 'token_expired',
  INVALID_SIGNATURE: 'invalid_signature',
  INVALID_AUDIENCE: 'invalid_audience',
  INVALID_ISSUER: 'invalid_issuer',
  MALFORMED_TOKEN: 'malformed_token',
  MISSING_CLAIMS: 'missing_claims',
  INVALID_ALGORITHM: 'invalid_algorithm',
  TOKEN_NOT_ACTIVE: 'token_not_active',
  VALIDATION_ERROR: 'validation_error',
} as const satisfies Record<string, TokenValidationErrorCode>

export interface TokenValidationError {
  code: TokenValidationErrorCode
  message: string
  details?: {
    expiredAt?: Date
    notActiveBefore?: Date
    expected?: string
    actual?: string
  }
}

export interface TokenValidationResult {
  valid: boolean
  error?: TokenValidationError
  payload?: unknown
}

// Auth0トークンレスポンスの型定義
export interface Auth0TokenResponse {
  access_token: string
  id_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

/**
 * Auth0認証URLを生成する
 */
export async function generateAuth0AuthUrl(state?: string): Promise<string> {
  const auth0Config = await getAuth0Config()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: auth0Config.clientId,
    redirect_uri: auth0Config.redirectUri,
    scope: auth0Config.scope,
    audience: auth0Config.audience,
  })

  if (state) {
    params.append('state', state)
  }

  return `https://${auth0Config.domain}/authorize?${params.toString()}`
}

/**
 * 認可コードをアクセストークンに交換する
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<Auth0TokenResponse> {
  const auth0Config = await getAuth0Config()
  const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      code,
      redirect_uri: auth0Config.redirectUri,
      audience: auth0Config.audience,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  return (await response.json()) as Auth0TokenResponse
}

/**
 * アクセストークンからユーザー情報を取得する
 */
export async function getUserInfo(accessToken: string): Promise<Auth0User> {
  const auth0Config = await getAuth0Config()
  const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  return (await response.json()) as Auth0User
}

/**
 * リフレッシュトークンで新しいアクセストークンを取得する
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Auth0TokenResponse> {
  const auth0Config = await getAuth0Config()
  const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh access token: ${error}`)
  }

  return (await response.json()) as Auth0TokenResponse
}

/**
 * Auth0ログアウトURLを生成する
 */
export async function generateAuth0LogoutUrl(
  returnTo?: string
): Promise<string> {
  const auth0Config = await getAuth0Config()
  const params = new URLSearchParams({
    client_id: auth0Config.clientId,
  })

  if (returnTo) {
    params.append('returnTo', returnTo)
  } else {
    params.append('returnTo', getAppRuntimeConfig().public.baseUrl)
  }

  return `https://${auth0Config.domain}/v2/logout?${params.toString()}`
}

// jwksClientの遅延初期化用のグローバル変数
let globalJwksClient: ReturnType<typeof jwksClient> | null = null
let cachedAuth0Domain: string | null = null

/**
 * jwksClientインスタンスを取得（遅延初期化）
 */
async function getJwksClientAsync(): Promise<ReturnType<typeof jwksClient>> {
  const auth0Config = await getAuth0Config()

  // ドメインが変わった場合は再初期化
  if (!globalJwksClient || cachedAuth0Domain !== auth0Config.domain) {
    globalJwksClient = jwksClient({
      jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
    })
    cachedAuth0Domain = auth0Config.domain
  }

  return globalJwksClient
}

/**
 * IDトークンを検証する（厳密版・RS256署名検証）
 */
export async function validateIdToken(
  idToken: string
): Promise<TokenValidationResult> {
  const auth0Config = await getAuth0Config()
  // 遅延初期化されたclientを利用
  const client = await getJwksClientAsync()

  function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    if (!header.kid) {
      return callback(new Error('No kid found in token header'))
    }
    client.getSigningKey(header.kid, function (err, key) {
      if (err) return callback(err)
      const signingKey = key?.getPublicKey()
      callback(null, signingKey)
    })
  }

  return new Promise((resolve) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://${auth0Config.domain}/`,
        audience: auth0Config.clientId,
      },
      (err: jwt.VerifyErrors | null, decoded: unknown) => {
        if (err) {
          const error = mapJwtErrorToValidationError(err, auth0Config)

          // セキュアログでエラー詳細を出力
          secureLog(
            'error',
            'ID token validation failed',
            {
              errorCode: error.code,
              errorMessage: error.message,
              errorDetails: error.details,
              jwtErrorName: err.name,
              jwtErrorMessage: err.message,
            },
            idToken
          )

          return resolve({
            valid: false,
            error,
          })
        }

        // 成功時のデバッグログ
        secureLog(
          'debug',
          'ID token validation successful',
          {
            payloadType: typeof decoded,
            hasPayload: !!decoded,
          },
          idToken
        )

        resolve({
          valid: true,
          payload: decoded,
        })
      }
    )
  })
}

/**
 * JWT検証エラーを詳細なエラー情報にマッピングする
 */
function mapJwtErrorToValidationError(
  err: jwt.VerifyErrors,
  auth0Config?: Auth0ConfigResolved
): TokenValidationError {
  // TokenExpiredErrorの場合
  if (err.name === 'TokenExpiredError') {
    const tokenExpiredError = err as TokenExpiredError
    return {
      code: 'token_expired',
      message: 'IDトークンの有効期限が切れています',
      details: {
        expiredAt: tokenExpiredError.expiredAt,
      },
    }
  }

  // NotBeforeErrorの場合
  if (err.name === 'NotBeforeError') {
    const notBeforeError = err as NotBeforeError
    return {
      code: 'token_not_active',
      message: 'IDトークンはまだ有効になっていません',
      details: {
        notActiveBefore: notBeforeError.date,
      },
    }
  }

  // JsonWebTokenErrorの場合 - メッセージ内容で詳細分類
  if (err.name === 'JsonWebTokenError') {
    const message = err.message.toLowerCase()

    // 署名エラー
    if (message.includes('invalid signature')) {
      return {
        code: 'invalid_signature',
        message: 'IDトークンの署名が不正です',
      }
    }

    // オーディエンス不一致
    if (message.includes('audience invalid')) {
      return {
        code: 'invalid_audience',
        message: 'IDトークンのオーディエンスが不正です',
        details: {
          expected:
            auth0Config?.clientId ||
            (message.includes('expected:')
              ? message.split('expected:')[1]?.trim()
              : undefined),
        },
      }
    }

    // 発行者不一致
    if (message.includes('issuer invalid')) {
      return {
        code: 'invalid_issuer',
        message: 'IDトークンの発行者が不正です',
        details: {
          expected: auth0Config
            ? `https://${auth0Config.domain}/`
            : message.includes('expected:')
              ? message.split('expected:')[1]?.trim()
              : undefined,
        },
      }
    }

    // アルゴリズム不正
    if (message.includes('invalid algorithm')) {
      return {
        code: 'invalid_algorithm',
        message: 'IDトークンの署名アルゴリズムが不正です',
      }
    }

    // トークン形式不正
    if (message.includes('malformed') || message.includes('invalid token')) {
      return {
        code: 'malformed_token',
        message: 'IDトークンの形式が不正です',
      }
    }

    // 必須クレーム不足
    if (message.includes('required') || message.includes('missing')) {
      return {
        code: 'missing_claims',
        message: 'IDトークンに必須のクレームが不足しています',
      }
    }
  }

  // その他のエラー
  return {
    code: 'validation_error',
    message: `IDトークンの検証に失敗しました: ${err.message}`,
  }
}
