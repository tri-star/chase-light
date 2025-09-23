import type { User } from "../../domain/user"
import type { UserRepository } from "../../domain/repositories/user.repository"

export interface GetProfileInput {
  auth0UserId: string
}

export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetProfileInput): Promise<User | null> {
    return this.userRepository.findByAuth0Id(input.auth0UserId)
  }
}
