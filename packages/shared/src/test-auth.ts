import process from "node:process"
import { SignJWT, jwtVerify } from "jose"
import {
  TEST_AUTH_ALLOWED_PREFIXES,
  TEST_AUTH_DEFAULT_USER_ID,
} from "./constants/test-auth"
import {
  findTestUserById,
  type TestUserDefinition,
} from "./constants/test-users"

export interface TestJwtPayload {
  sub: string
  iss: string
  aud: string | string[]
  email?: string
  name?: string
  picture?: string
  exp?: number
  iat?: number
  [key: string]: unknown
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

if (!globalThis.TextEncoder) {
  throw new Error("TextEncoder is not available in this environment")
}

const textEncoder = new globalThis.TextEncoder()

function getHs256Key(secret: string): Uint8Array {
  return textEncoder.encode(secret)
}

/**
 * テスト用の署名済みJWTを発行する
 */
export async function issueTestJwt(options: IssueTestJwtOptions = {}): Promise<{
  token: string
  payload: TestJwtPayload
  user: TestUserDefinition
}> {
  const user = resolveTestUser(options.userId)
  const secret = getRequiredEnv("TEST_AUTH_SECRET")
  const audience = getRequiredEnv("TEST_AUTH_AUDIENCE")
  const issuer = getRequiredEnv("TEST_AUTH_ISSUER")
  const expiresInSeconds = options.expiresInSeconds ?? 60 * 60 // 1時間

  const payload: TestJwtPayload = {
    sub: user.id,
    iss: issuer,
    aud: audience,
    email: user.email,
    name: user.name,
    picture: user.avatarUrl,
    ...options.additionalClaims,
  }

  const token = await new SignJWT({
    ...payload,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(audience)
    .setIssuer(issuer)
    .setSubject(payload.sub)
    .setExpirationTime(`${expiresInSeconds}s`)
    .setIssuedAt()
    .sign(getHs256Key(secret))

  return { token, payload, user }
}

/**
 * テスト用JWTを検証し、ペイロードを返す
 */
export async function verifyTestJwt(token: string): Promise<TestJwtPayload> {
  const secret = getRequiredEnv("TEST_AUTH_SECRET")
  const audience = getRequiredEnv("TEST_AUTH_AUDIENCE")
  const issuer = getRequiredEnv("TEST_AUTH_ISSUER")

  const { payload, protectedHeader } = await jwtVerify<TestJwtPayload>(
    token,
    getHs256Key(secret),
    {
      audience,
      issuer,
      algorithms: ["HS256"],
    },
  )

  if (protectedHeader.alg !== "HS256") {
    throw new Error("Test auth tokens must be signed with HS256")
  }

  if (!payload.sub) {
    throw new Error("sub claim is required in test auth tokens")
  }

  return payload
}
