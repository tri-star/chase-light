import { UserRepository } from "../../../repositories/user.repository.js"
import type { User } from "../../../repositories/user.repository.js"
import { validateTimezone } from "../domain/timezone.js"

export interface UpdateProfileRequest {
  name?: string
  githubUsername?: string
  timezone?: string
}

/**
 * ユーザープロフィール管理サービス
 * プロフィール情報の取得・更新に特化
 */
export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

  /**
   * 認証済みユーザーのプロフィール取得
   */
  async getUserProfile(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId)
  }

  /**
   * Auth0 ID経由でのプロフィール取得
   */
  async getUserProfileByAuth0Id(auth0UserId: string): Promise<User | null> {
    return this.userRepository.findByAuth0Id(auth0UserId)
  }

  /**
   * プロフィール情報更新
   */
  async updateUserProfile(
    userId: string,
    data: UpdateProfileRequest,
  ): Promise<User | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // メールアドレスの重複チェック（メール更新は別サービスで処理）
    // ここではname, githubUsername, timezoneのみ更新

    // GitHubユーザー名の重複チェック
    if (data.githubUsername && data.githubUsername !== user.githubUsername) {
      const existingUser = await this.userRepository.findByGithubUsername(
        data.githubUsername,
      )
      if (existingUser && existingUser.id !== userId) {
        throw new Error("このGitHubユーザー名は既に使用されています")
      }
    }

    // タイムゾーンの検証
    validateTimezone(data.timezone)

    return this.userRepository.update(userId, data)
  }
}

// シングルトンインスタンス
export const userProfileService = new UserProfileService(new UserRepository())
