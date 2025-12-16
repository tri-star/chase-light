/**
 * Auth0 Configuration
 *
 * Auth0設定の取得と検証
 */
import type { Auth0Config } from "../../features/identity/types/auth.types.js"
import { getSsmParameterValue } from "./ssm-parameter"

/**
 * 環境変数からAuth0設定を取得
 */
export async function getAuth0Config(): Promise<Auth0Config> {
  const isAWSEnvironment = process.env.USE_AWS === "true"

  const audience = process.env.AUTH0_AUDIENCE
  const appAudience = process.env.AUTH0_APP_AUDIENCE

  let domain: string | null | undefined = process.env.AUTH0_DOMAIN

  if (isAWSEnvironment) {
    const awsRegion = process.env.AWS_REGION
    const stage = process.env.APP_STAGE

    if (!awsRegion) {
      throw new Error(
        "AWS_REGION environment variable is required when USE_AWS is true",
      )
    }

    if (!stage) {
      throw new Error(
        "APP_STAGE environment variable is required when USE_AWS is true",
      )
    }

    const parameterName = `/${stage}-chase-light/auth0/domain`
    domain = await getSsmParameterValue(parameterName)

    if (!domain) {
      throw new Error(`Auth0 domain parameter not found: ${parameterName}`)
    }
  }

  if (!domain) {
    throw new Error("AUTH0_DOMAIN environment variable is required")
  }

  if (!audience) {
    throw new Error("AUTH0_AUDIENCE environment variable is required")
  }

  if (!appAudience) {
    throw new Error("AUTH0_APP_AUDIENCE environment variable is required")
  }

  // ドメインの形式チェック（https://プレフィックスを除去）
  const cleanDomain = domain.replace(/^https?:\/\//, "")

  return {
    domain: cleanDomain,
    audience,
    appAudience,
    issuer: `https://${cleanDomain}/`,
    jwksUri: `https://${cleanDomain}/.well-known/jwks.json`,
    algorithms: ["RS256"], // Auth0のデフォルト
  }
}

/**
 * Auth0設定の検証
 */
export function validateAuth0Config(config: Auth0Config): void {
  if (!config.domain) {
    throw new Error("Auth0 domain is required")
  }

  if (!config.audience) {
    throw new Error("Auth0 audience is required")
  }

  if (!config.appAudience) {
    throw new Error("Auth0 app audience is required")
  }

  if (!config.issuer) {
    throw new Error("Auth0 issuer is required")
  }

  if (!config.jwksUri) {
    throw new Error("Auth0 JWKS URI is required")
  }

  if (!Array.isArray(config.algorithms) || config.algorithms.length === 0) {
    throw new Error("Auth0 algorithms must be a non-empty array")
  }

  // URLの形式チェック
  try {
    new globalThis.URL(config.issuer)
    new globalThis.URL(config.jwksUri)
  } catch {
    throw new Error("Auth0 issuer or JWKS URI is not a valid URL")
  }
}
