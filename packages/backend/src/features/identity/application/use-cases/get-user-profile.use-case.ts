import type { User } from "../../domain/user"
import type { UserRepository } from "../../domain/repositories/user.repository"

export type GetUserProfileByIdInputDto = {
  userId: string
}

export type GetUserProfileByAuth0IdInputDto = {
  auth0UserId: string
}

export type GetUserProfileOutputDto = User | null

/**
 * ユーザープロフィール取得ユースケース
 * プロフィール情報の取得に特化
 */
export class GetUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * 認証済みユーザーのプロフィール取得
   */
  async getUserProfileById(
    input: GetUserProfileByIdInputDto,
  ): Promise<GetUserProfileOutputDto> {
    return this.userRepository.findById(input.userId)
  }

  /**
   * Auth0 ID経由でのプロフィール取得
   */
  async getUserProfileByAuth0Id(
    input: GetUserProfileByAuth0IdInputDto,
  ): Promise<GetUserProfileOutputDto> {
    return this.userRepository.findByAuth0Id(input.auth0UserId)
  }
}
