/**
 * Auth Signup Service
 *
 * ユーザー登録機能を提供するサービス
 */
import { JWTValidator } from "./jwt-validator.service"
import { UserRepository } from "../../../repositories/user.repository"
import type { User } from "../../../repositories/user.repository"
import { AuthError } from "../errors/auth.error"
import { getAuth0Config } from "../utils/auth-config"
import type { JWTPayload } from "../types/auth.types"

export interface SignUpRequest {
  idToken: string
}

export interface SignUpResponse {
  user: {
    id: string
    email: string
    name: string
    githubUsername?: string
    avatarUrl: string
    createdAt: string
  }
  message: string
  alreadyExists?: boolean
}

/**
 * Auth0のIDトークンから必要な情報を抽出
 */
interface ExtractedUserInfo {
  auth0UserId: string
  email: string
  name: string
  avatarUrl: string
  githubUsername?: string
}

/**
 * ユーザー登録サービス
 */
export class AuthSignupService {
  private readonly jwtValidator: JWTValidator
  private readonly userRepository: UserRepository

  constructor(jwtValidator?: JWTValidator, userRepository?: UserRepository) {
    this.jwtValidator = jwtValidator || new JWTValidator(getAuth0Config())
    this.userRepository = userRepository || new UserRepository()
  }

  /**
   * ユーザー登録処理
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    // IDトークンの検証
    const validationResult = await this.jwtValidator.validateAccessToken(
      request.idToken,
    )

    if (!validationResult.valid || !validationResult.payload) {
      throw AuthError.tokenInvalid(validationResult.error || "Invalid ID token")
    }

    // IDトークンからユーザー情報を抽出
    const userInfo = this.extractUserInfoFromToken(validationResult.payload)

    // ユーザーの作成または更新（既存の場合は更新）
    const user = await this.userRepository.findOrCreateByAuth0({
      ...userInfo,
      timezone: "Asia/Tokyo", // デフォルトのタイムゾーン
    })

    // 既存ユーザーかどうかを判定
    const isNewUser = this.isNewlyCreated(user)

    return {
      user: this.formatUserResponse(user),
      message: isNewUser
        ? "ユーザー登録が完了しました"
        : "既にアカウントが存在します。ログイン情報を更新しました",
      alreadyExists: !isNewUser,
    }
  }

  /**
   * IDトークンからユーザー情報を抽出
   */
  private extractUserInfoFromToken(payload: JWTPayload): ExtractedUserInfo {
    // 必須フィールドの検証
    if (!payload.sub) {
      throw AuthError.missingClaims("sub")
    }

    if (!payload.email) {
      throw AuthError.missingClaims("email")
    }

    if (!payload.name) {
      throw AuthError.missingClaims("name")
    }

    return {
      auth0UserId: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      avatarUrl: (payload.picture as string) || "", // pictureクレームからアバターURL
      githubUsername: this.extractGithubUsername(payload),
    }
  }

  /**
   * GitHubユーザー名を抽出
   * Auth0のGitHub接続時に提供される可能性のあるフィールドから抽出
   */
  private extractGithubUsername(payload: JWTPayload): string | undefined {
    // nicknameフィールドにGitHubユーザー名が含まれることが多い
    if (payload.nickname && typeof payload.nickname === "string") {
      return payload.nickname
    }

    // preferred_usernameも確認
    if (
      payload.preferred_username &&
      typeof payload.preferred_username === "string"
    ) {
      return payload.preferred_username
    }

    // GitHub接続の場合、subからユーザー名を抽出できる場合がある
    // 例: "github|12345" -> GitHub ID, "auth0|github|username" -> username
    if (payload.sub.includes("github")) {
      const parts = payload.sub.split("|")
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1]
        // 数字のみでなければユーザー名の可能性
        if (!/^\d+$/.test(lastPart)) {
          return lastPart
        }
      }
    }

    return undefined
  }

  /**
   * 新規作成されたユーザーかどうかを判定
   * createdAtとupdatedAtの差が1秒以内なら新規作成とみなす
   */
  private isNewlyCreated(user: User): boolean {
    if (!user.createdAt || !user.updatedAt) {
      return false
    }

    const createdTime = new Date(user.createdAt).getTime()
    const updatedTime = new Date(user.updatedAt).getTime()
    const timeDiff = Math.abs(updatedTime - createdTime)

    // 1秒以内の差なら新規作成
    return timeDiff <= 1000
  }

  /**
   * レスポンス用のユーザー情報フォーマット
   */
  private formatUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      githubUsername: user.githubUsername || undefined,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    }
  }
}

// シングルトンインスタンス
export const authSignupService = new AuthSignupService()
