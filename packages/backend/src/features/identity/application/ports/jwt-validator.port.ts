/**
 * JWT Validator Port
 *
 * JWT検証の外部サービス抽象化ポート
 */
import type { TokenValidationResult } from "../../types/auth.types"

/**
 * JWT検証ポート
 *
 * 外部サービス（Auth0）とのやり取りを抽象化するポート定義
 */
export interface JwtValidatorPort {
  /**
   * アクセストークンを検証する
   */
  validateAccessToken(token: string): Promise<TokenValidationResult>

  /**
   * IDトークンを検証する
   */
  validateIdToken(token: string): Promise<TokenValidationResult>
}
