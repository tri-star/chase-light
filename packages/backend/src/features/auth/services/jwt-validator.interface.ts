/**
 * JWT Validator Interface
 *
 * JWT検証のインターフェースと環境別ファクトリー関数
 */
import type { TokenValidationResult, Auth0Config } from "../types/auth.types"
import { JWTValidator } from "./jwt-validator.service"
import { MockJWTValidator } from "./mock-jwt-validator.service"
import { getAuth0Config, validateAuth0Config } from "../utils/auth-config"

/**
 * JWT検証インターフェース
 */
export interface JWTValidatorInterface {
  /**
   * アクセストークンを検証する
   */
  validateAccessToken(token: string): Promise<TokenValidationResult>
}

/**
 * 環境に応じたJWTValidatorインスタンスを生成するファクトリー関数
 * 
 * @param config - Auth0設定（本番環境用、省略時は環境変数から取得）
 * @returns 環境に適したJWTValidatorインスタンス
 */
export function createJWTValidator(config?: Auth0Config): JWTValidatorInterface {
  // テスト環境ではMockJWTValidatorを使用
  if (process.env.NODE_ENV === "test") {
    return new MockJWTValidator()
  }

  // 本番環境では実際のJWTValidatorを使用
  if (!config) {
    config = getAuth0Config()
    validateAuth0Config(config)
  }
  
  return new JWTValidator(config)
}