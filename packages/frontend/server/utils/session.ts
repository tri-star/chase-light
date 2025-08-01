import type { H3Event } from 'h3';
import { getCookie, setCookie } from 'h3';
import { Pool } from 'pg';
import crypto from 'crypto';

// PostgreSQL接続プール
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    pool = new Pool({
      connectionString: dbUrl,
      ssl:
        process.env.APP_STAGE === 'production'
          ? { rejectUnauthorized: true }
          : false,
      // SCRAM認証の問題を回避するための明示的な設定
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

// セッションデータの型定義
export interface UserSession {
  id: string;
  userId?: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  loggedInAt: Date;
  [key: string]: unknown;
}

// セッション設定
const SESSION_CONFIG = {
  cookieName: 'nuxt-session',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: process.env.APP_STAGE === 'prod',
  httpOnly: true,
  sameSite: 'lax' as const,
};

/**
 * セッションIDを生成する
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * セッションを暗号化する
 */
function encryptSession(sessionId: string): string {
  const config = useRuntimeConfig();
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.sessionSecret!, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(sessionId, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * セッションを復号化する
 */
function decryptSession(encryptedSessionId: string): string {
  try {
    const config = useRuntimeConfig();
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.sessionSecret!, 'salt', 32);

    const parts = encryptedSessionId.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted session format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    throw new Error('Invalid session token');
  }
}

/**
 * ユーザーセッションを取得する
 */
export async function getUserSession(
  event: H3Event
): Promise<UserSession | null> {
  const sessionCookie = getCookie(event, SESSION_CONFIG.cookieName);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionId = decryptSession(sessionCookie);
    const pool = getPool();

    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];
    return {
      id: session.id,
      userId: session.user_id,
      email: session.email,
      name: session.name,
      avatar: session.avatar,
      provider: session.provider,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      loggedInAt: session.logged_in_at,
    };
  } catch (error) {
    console.error('Failed to get user session:', error);
    return null;
  }
}

/**
 * ユーザーセッションを設定する
 */
export async function setUserSession(
  event: H3Event,
  data: Omit<UserSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserSession> {
  const sessionId = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_CONFIG.maxAge * 1000);

  const pool = getPool();

  const session: UserSession = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    loggedInAt: (data.loggedInAt as Date) || now,
    ...data,
  };

  await pool.query(
    `
    INSERT INTO sessions (
      id, user_id, email, name, avatar, provider,
      access_token, refresh_token, expires_at, created_at, updated_at, logged_in_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `,
    [
      session.id,
      session.userId,
      session.email,
      session.name,
      session.avatar,
      session.provider,
      session.accessToken,
      session.refreshToken,
      session.expiresAt,
      session.createdAt,
      session.updatedAt,
      session.loggedInAt,
    ]
  );

  // セッションクッキーを設定
  const encryptedSessionId = encryptSession(sessionId);
  setCookie(event, SESSION_CONFIG.cookieName, encryptedSessionId, {
    maxAge: SESSION_CONFIG.maxAge,
    secure: SESSION_CONFIG.secure,
    httpOnly: SESSION_CONFIG.httpOnly,
    sameSite: SESSION_CONFIG.sameSite,
  });

  return session;
}

/**
 * ユーザーセッションをクリアする
 */
export async function clearUserSession(event: H3Event): Promise<boolean> {
  const sessionCookie = getCookie(event, SESSION_CONFIG.cookieName);

  if (!sessionCookie) {
    return false;
  }

  try {
    const sessionId = decryptSession(sessionCookie);
    const pool = getPool();

    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    // クッキーを削除
    deleteCookie(event, SESSION_CONFIG.cookieName);

    return true;
  } catch (error) {
    console.error('Failed to clear user session:', error);
    return false;
  }
}

/**
 * 認証が必要なエンドポイントでセッションを要求する
 */
export async function requireUserSession(event: H3Event): Promise<UserSession> {
  const session = await getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  return session;
}

/**
 * 期限切れセッションをクリーンアップする
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}
