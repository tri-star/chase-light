import { UserRepository } from "../repositories/user.repository"
import type { User } from "../domain/user"

export type UpdateProfileInputDto = {
  name: string
  email: string
}

export type UpdateProfileOutputDto = User

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
    input: UpdateProfileInputDto,
  ): Promise<UpdateProfileOutputDto | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // メールアドレスの重複チェック（メール更新は別サービスで処理）
    // ここではname, githubUsername, timezoneのみ更新
    user.name = input.name
    user.email = input.email
    this.userRepository.save(user)

    return user
  }
}

// シングルトンインスタンス
export const userProfileService = new UserProfileService(new UserRepository())
