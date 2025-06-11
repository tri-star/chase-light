import { H3Event } from 'h3'

// Auth0設定
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  scope: 'openid profile email',
  redirectUri: `${process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`
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
  [key: string]: any
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
export function generateAuth0AuthUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: auth0Config.clientId,
    redirect_uri: auth0Config.redirectUri,
    scope: auth0Config.scope,
    audience: auth0Config.audience
  })

  if (state) {
    params.append('state', state)
  }

  return `https://${auth0Config.domain}/authorize?${params.toString()}`
}

/**
 * 認可コードをアクセストークンに交換する
 */
export async function exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
  const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      code,
      redirect_uri: auth0Config.redirectUri
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  return await response.json() as Auth0TokenResponse
}

/**
 * アクセストークンからユーザー情報を取得する
 */
export async function getUserInfo(accessToken: string): Promise<Auth0User> {
  const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  return await response.json() as Auth0User
}

/**
 * リフレッシュトークンで新しいアクセストークンを取得する
 */
export async function refreshAccessToken(refreshToken: string): Promise<Auth0TokenResponse> {
  const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh access token: ${error}`)
  }

  return await response.json() as Auth0TokenResponse
}

/**
 * Auth0ログアウトURLを生成する
 */
export function generateAuth0LogoutUrl(returnTo?: string): string {
  const params = new URLSearchParams({
    client_id: auth0Config.clientId
  })

  if (returnTo) {
    params.append('returnTo', returnTo)
  } else {
    params.append('returnTo', process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  }

  return `https://${auth0Config.domain}/v2/logout?${params.toString()}`
}

/**
 * IDトークンを検証する（簡易版）
 */
export function validateIdToken(idToken: string): any {
  try {
    // JWT の payload 部分をデコード（本番環境では適切な検証が必要）
    const [, payload] = idToken.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    
    // 基本的な検証
    if (decoded.iss !== `https://${auth0Config.domain}/`) {
      throw new Error('Invalid issuer')
    }
    
    if (decoded.aud !== auth0Config.clientId) {
      throw new Error('Invalid audience')
    }
    
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired')
    }
    
    return decoded
  } catch (error) {
    throw new Error(`Invalid ID token: ${error}`)
  }
}