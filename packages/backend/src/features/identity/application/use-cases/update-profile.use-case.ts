import type { User } from "../../domain/user"
import type { UserRepository } from "../../domain/repositories/user.repository"
import { UserError } from "../../errors/user.error"

export interface UpdateProfileInput {
  userId: string
  name: string
  email: string
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateProfileInput): Promise<User | null> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      return null
    }

    if (input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email)
      if (existingUser && existingUser.id !== user.id) {
        throw UserError.emailAlreadyExists(input.email)
      }
    }

    const updatedAt = new Date()
    const userToSave: User = {
      ...user,
      name: input.name,
      email: input.email,
      updatedAt,
    }

    await this.userRepository.save(userToSave)

    return this.userRepository.findById(user.id)
  }
}
