import process from "node:process"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import {
  TEST_AUTH_ALLOWED_PREFIXES,
  TEST_AUTH_DEFAULT_USER_ID,
} from "./constants/test-auth"
import {
  findTestUserById,
  type TestUserDefinition,
} from "./constants/test-users"

export interface TestJwtPayload extends JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

export interface IssueTestJwtOptions {
  userId?: string
  expiresInSeconds?: number
  additionalClaims?: Record<string, unknown>
}

/**
 * テスト用Authを有効化しているかどうか
 */
export function isTestAuthEnabled(): boolean {
  return process.env.TEST_AUTH_ENABLED === "true"
}

/**
 * 指定されたIDからテストユーザー情報を解決する
 */
export function resolveTestUser(requestedId?: string): TestUserDefinition {
  const candidateId = requestedId ?? TEST_AUTH_DEFAULT_USER_ID
  const isAllowed = TEST_AUTH_ALLOWED_PREFIXES.some((prefix) =>
    candidateId.startsWith(prefix),
  )

  if (!isAllowed) {
    throw new Error(
      `User ID "${candidateId}" is not allowed in test auth mode. Allowed prefixes: ${TEST_AUTH_ALLOWED_PREFIXES.join(
        ", ",
      )}`,
    )
  }

  const user = findTestUserById(candidateId)
  if (!user) {
    throw new Error(
      `User ID "${candidateId}" is not registered in test user definitions`,
    )
  }

  return user
}

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required for test auth`)
  }
  return value
}

/**
 * テスト用の署名済みJWTを発行する
 */
export function issueTestJwt(options: IssueTestJwtOptions = {}): {
  token: string
  payload: TestJwtPayload
  user: TestUserDefinition
} {
  const user = resolveTestUser(options.userId)
  const secret = getRequiredEnv("TEST_AUTH_SECRET")
  const audience = getRequiredEnv("TEST_AUTH_AUDIENCE")
  const issuer = getRequiredEnv("TEST_AUTH_ISSUER")
  const expiresInSeconds = options.expiresInSeconds ?? 60 * 60 // 1時間

  const payload: TestJwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.avatarUrl,
    ...options.additionalClaims,
  }

  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    audience,
    issuer,
    expiresIn: expiresInSeconds,
  })

  return { token, payload, user }
}

/**
 * テスト用JWTを検証し、ペイロードを返す
 */
export function verifyTestJwt(token: string): TestJwtPayload {
  const secret = getRequiredEnv("TEST_AUTH_SECRET")
  const audience = getRequiredEnv("TEST_AUTH_AUDIENCE")
  const issuer = getRequiredEnv("TEST_AUTH_ISSUER")

  const decoded = jwt.verify(token, secret, {
    audience,
    issuer,
    algorithms: ["HS256"],
  })

  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token payload")
  }

  const payload = decoded as TestJwtPayload
  if (!payload.sub) {
    throw new Error("sub claim is required in test auth tokens")
  }

  if (!payload.iss) {
    throw new Error("iss claim is required in test auth tokens")
  }

  if (!payload.aud) {
    throw new Error("aud claim is required in test auth tokens")
  }

  return payload
}
