/**
 * JWT Validator Factory
 *
 * 環境に応じたJWTValidatorインスタンスを生成するファクトリー関数
 */
import type { Auth0Config } from "../../../types/auth.types"
import type { JwtValidatorPort } from "../../../application/ports/jwt-validator.port"
import { JwtValidatorAdapter } from "./jwt-validator.adapter"
import { StubJwtValidatorAdapter } from "./stub-jwt-validator.adapter"
import {
  getAuth0Config,
  validateAuth0Config,
} from "../../../../../core/config/auth0"

/**
 * 環境に応じたJwtValidatorインスタンスを生成するファクトリー関数
 *
 * @param config - Auth0設定（本番環境用、省略時は環境変数から取得）
 * @returns 環境に適したJwtValidatorインスタンス
 */
export function createJwtValidatorAdapter(
  config?: Auth0Config,
): Promise<JwtValidatorPort> {
  // テスト環境ではStubJwtValidatorAdapterを使用
  if (process.env.NODE_ENV === "test") {
    return Promise.resolve(new StubJwtValidatorAdapter())
  }

  // 本番環境では実際のJwtValidatorAdapterを使用
  return (async () => {
    if (!config) {
      config = await getAuth0Config()
      validateAuth0Config(config)
    }

    return new JwtValidatorAdapter(config)
  })()
}
