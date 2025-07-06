/**
 * Mock JWT Validator
 *
 * テスト環境用のJWT検証モック実装
 */
import type { JWTPayload, TokenValidationResult } from "../types/auth.types"
import type { JWTValidatorInterface } from "./jwt-validator.interface"
import { AuthError } from "../errors/auth.error"

/**
 * テスト用JWT検証クラス
 */
export class MockJWTValidator implements JWTValidatorInterface {
  private static testUsers: Map<string, JWTPayload> = new Map()

  /**
   * テスト用ユーザーを登録
   * 
   * @param token - テスト用トークン
   * @param payload - JWTペイロード
   */
  static registerTestUser(token: string, payload: JWTPayload): void {
    this.testUsers.set(token, payload)
  }

  /**
   * 登録済みテストユーザーをクリア
   */
  static clearTestUsers(): void {
    this.testUsers.clear()
  }

  /**
   * 登録済みテストユーザー数を取得（デバッグ用）
   */
  static getTestUserCount(): number {
    return this.testUsers.size
  }

  /**
   * 登録済みトークン一覧を取得（デバッグ用）
   */
  static getRegisteredTokens(): string[] {
    return Array.from(this.testUsers.keys())
  }

  /**
   * アクセストークンを検証する（モック実装）
   * 
   * @param token - 検証するトークン
   * @returns 検証結果
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // トークンの基本的な形式チェック
      if (!token || typeof token !== "string") {
        throw AuthError.tokenMissing()
      }

      // Bearerプレフィックスを除去
      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()

      if (!cleanToken) {
        throw AuthError.tokenMissing()
      }

      // 登録済みテストユーザーから検索
      const payload = MockJWTValidator.testUsers.get(cleanToken)

      if (payload) {
        // 有効なテストトークン
        return {
          valid: true,
          payload,
        }
      }

      // 無効なトークン
      throw AuthError.tokenInvalid("Invalid test token")
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          valid: false,
          error: error.message,
        }
      }

      // 予期しないエラー
      return {
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}