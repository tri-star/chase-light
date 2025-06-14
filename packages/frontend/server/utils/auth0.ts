import jwt from 'jsonwebtoken';
import type { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * Auth0設定を取得する
 */
function getAuth0Config() {
  const config = useRuntimeConfig();
  return {
    domain: config.auth0Domain!,
    clientId: config.auth0ClientId!,
    clientSecret: config.auth0ClientSecret!,
    audience: config.auth0Audience!,
    scope: 'openid profile email',
    redirectUri: `${config.public.baseUrl}/api/auth/callback`,
  };
}

// Auth0ユーザー情報の型定義
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  [key: string]: unknown;
}

// Auth0トークンレスポンスの型定義
export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Auth0認証URLを生成する
 */
export function generateAuth0AuthUrl(state?: string): string {
  const auth0Config = getAuth0Config();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: auth0Config.clientId,
    redirect_uri: auth0Config.redirectUri,
    scope: auth0Config.scope,
    audience: auth0Config.audience,
  });

  if (state) {
    params.append('state', state);
  }

  return `https://${auth0Config.domain}/authorize?${params.toString()}`;
}

/**
 * 認可コードをアクセストークンに交換する
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<Auth0TokenResponse> {
  const auth0Config = getAuth0Config();
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return (await response.json()) as Auth0TokenResponse;
}

/**
 * アクセストークンからユーザー情報を取得する
 */
export async function getUserInfo(accessToken: string): Promise<Auth0User> {
  const auth0Config = getAuth0Config();
  const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return (await response.json()) as Auth0User;
}

/**
 * リフレッシュトークンで新しいアクセストークンを取得する
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Auth0TokenResponse> {
  const auth0Config = getAuth0Config();
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return (await response.json()) as Auth0TokenResponse;
}

/**
 * Auth0ログアウトURLを生成する
 */
export function generateAuth0LogoutUrl(returnTo?: string): string {
  const auth0Config = getAuth0Config();
  const params = new URLSearchParams({
    client_id: auth0Config.clientId,
  });

  if (returnTo) {
    params.append('returnTo', returnTo);
  } else {
    params.append('returnTo', useRuntimeConfig().public.baseUrl);
  }

  return `https://${auth0Config.domain}/v2/logout?${params.toString()}`;
}

// jwksClientの遅延初期化用のグローバル変数
let globalJwksClient: ReturnType<typeof jwksClient> | null = null;
let cachedAuth0Domain: string | null = null;

/**
 * jwksClientインスタンスを取得（遅延初期化）
 */
function getJwksClient(): ReturnType<typeof jwksClient> {
  const auth0Config = getAuth0Config();

  // ドメインが変わった場合は再初期化
  if (!globalJwksClient || cachedAuth0Domain !== auth0Config.domain) {
    globalJwksClient = jwksClient({
      jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
    });
    cachedAuth0Domain = auth0Config.domain;
  }

  return globalJwksClient;
}

/**
 * IDトークンを検証する（厳密版・RS256署名検証）
 */
export async function validateIdToken(idToken: string): Promise<unknown> {
  const auth0Config = getAuth0Config();
  // 遅延初期化されたclientを利用
  const client = getJwksClient();

  function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    if (!header.kid) {
      return callback(new Error('No kid found in token header'));
    }
    client.getSigningKey(header.kid, function (err, key) {
      if (err) return callback(err);
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  }

  return new Promise((resolve, reject) => {
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
          return reject(new Error(`Invalid ID token: ${err}`));
        }
        resolve(decoded);
      }
    );
  });
}
