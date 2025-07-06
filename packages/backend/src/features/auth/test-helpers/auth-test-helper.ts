/**
 * Authentication Test Helper
 *
 * 認証関連のテストユーティリティ
 */
import type { JWTPayload } from "../types/auth.types"
import { MockJWTValidator } from "../services/mock-jwt-validator.service"

/**
 * 認証テスト用ヘルパークラス
 */
export class AuthTestHelper {
  /**
   * テスト用トークンを生成してMockJWTValidatorに登録
   * 
   * @param userId - ユーザーID (Auth0のsub)
   * @param email - メールアドレス
   * @param name - ユーザー名
   * @param additionalClaims - 追加のクレーム
   * @returns 生成されたテストトークン
   */
  static createTestToken(
    userId: string,
    email: string,
    name: string,
    additionalClaims: Partial<JWTPayload> = {},
  ): string {
    const token = `test-token-${userId}`
    const currentTime = Math.floor(Date.now() / 1000)
    
    const payload: JWTPayload = {
      sub: userId,
      email,
      name,
      iss: "https://test.auth0.com/",
      aud: "test-audience",
      iat: currentTime,
      exp: currentTime + 3600, // 1時間後に有効期限
      ...additionalClaims,
    }

    MockJWTValidator.registerTestUser(token, payload)
    return token
  }

  /**
   * 認証ヘッダーを生成
   * 
   * @param token - トークン
   * @returns Authorization ヘッダー
   */
  static createAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * 複数のテストユーザーを一括作成
   * 
   * @param users - ユーザー情報の配列
   * @returns 生成されたトークンの配列
   */
  static createTestUsers(
    users: Array<{
      userId: string
      email: string
      name: string
      additionalClaims?: Partial<JWTPayload>
    }>
  ): string[] {
    return users.map((user) =>
      this.createTestToken(
        user.userId,
        user.email,
        user.name,
        user.additionalClaims,
      ),
    )
  }

  /**
   * 無効なトークンを生成（認証失敗テスト用）
   * 
   * @param tokenSuffix - トークンの識別子
   * @returns 無効なテストトークン
   */
  static createInvalidToken(tokenSuffix = "invalid"): string {
    return `invalid-test-token-${tokenSuffix}`
  }

  /**
   * 期限切れトークンを生成
   * 
   * @param userId - ユーザーID
   * @param email - メールアドレス
   * @param name - ユーザー名
   * @returns 期限切れのテストトークン
   */
  static createExpiredToken(
    userId: string,
    email: string,
    name: string,
  ): string {
    const token = `expired-token-${userId}`
    const currentTime = Math.floor(Date.now() / 1000)
    
    const payload: JWTPayload = {
      sub: userId,
      email,
      name,
      iss: "https://test.auth0.com/",
      aud: "test-audience",
      iat: currentTime - 7200, // 2時間前に発行
      exp: currentTime - 3600, // 1時間前に期限切れ
    }

    MockJWTValidator.registerTestUser(token, payload)
    return token
  }

  /**
   * テストユーザーをクリア
   */
  static clearTestUsers(): void {
    MockJWTValidator.clearTestUsers()
  }

  /**
   * 登録済みテストユーザー数を取得（デバッグ用）
   */
  static getTestUserCount(): number {
    return MockJWTValidator.getTestUserCount()
  }
}