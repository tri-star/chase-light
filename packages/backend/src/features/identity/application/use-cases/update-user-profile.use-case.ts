import type { User } from "../../domain/user"
import type { UserRepository } from "../../domain/repositories/user.repository"
import { UserError } from "../../errors/user.error"

export type UpdateUserProfileInputDto = {
  userId: string
  name: string
  email: string
}

export type UpdateUserProfileOutputDto = User | null

/**
 * ユーザープロフィール更新ユースケース
 * プロフィール情報の更新に特化
 */
export class UpdateUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * プロフィール情報更新
   */
  async updateUserProfile(
    input: UpdateUserProfileInputDto,
  ): Promise<UpdateUserProfileOutputDto> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      return null
    }

    // メールアドレスの重複チェック（現在のユーザー以外で同じメールが使用されていないか）
    if (input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email)
      if (existingUser && existingUser.id !== user.id) {
        throw UserError.emailAlreadyExists(input.email)
      }
    }

    // プロフィール情報を更新
    user.name = input.name
    user.email = input.email
    await this.userRepository.save(user)

    return user
  }
}
