import { uuidv7 } from "uuidv7"
import { AuthError } from "../../../../core/auth/errors/auth.error"
import type { JWTPayload } from "../../../../core/auth/types/jwt.types"
import { DEFAULT_TIMEZONE } from "../../constants"
import type { User } from "../../domain/user"
import type { UserRepository } from "../../domain/repositories/user.repository"
import type { JWTValidatorPort } from "../ports/jwt-validator.port"

export interface SignUpInput {
  idToken: string
}

export interface SignUpResult {
  user: User
  alreadyExists: boolean
}

interface ExtractedUserInfo {
  auth0UserId: string
  email: string
  name: string
  avatarUrl: string
  githubUsername?: string
}

export class SignUpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtValidator: JWTValidatorPort,
  ) {}

  async execute(input: SignUpInput): Promise<SignUpResult> {
    const validationResult = await this.jwtValidator.validateIdToken(
      input.idToken,
    )

    if (!validationResult.valid || !validationResult.payload) {
      throw AuthError.tokenInvalid(validationResult.error)
    }

    const userInfo = this.extractUserInfoFromToken(validationResult.payload)

    const existingUser = await this.userRepository.findByAuth0Id(
      userInfo.auth0UserId,
    )
    const isNewUser = !existingUser

    const now = new Date()
    const userToSave: User = {
      id: existingUser?.id ?? uuidv7(),
      auth0UserId: userInfo.auth0UserId,
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
      githubUsername: userInfo.githubUsername ?? existingUser?.githubUsername ?? null,
      timezone: existingUser?.timezone ?? DEFAULT_TIMEZONE,
      createdAt: existingUser?.createdAt ?? now,
      updatedAt: now,
    }

    await this.userRepository.save(userToSave)

    const savedUser = await this.userRepository.findById(userToSave.id)
    if (!savedUser) {
      throw new Error("ユーザーの作成に失敗しました")
    }

    return {
      user: savedUser,
      alreadyExists: !isNewUser,
    }
  }

  private extractUserInfoFromToken(payload: JWTPayload): ExtractedUserInfo {
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
      avatarUrl: (payload.picture as string) || "",
      githubUsername: this.extractGithubUsername(payload),
    }
  }

  private extractGithubUsername(payload: JWTPayload): string | undefined {
    if (payload.nickname && typeof payload.nickname === "string") {
      return payload.nickname
    }

    if (
      payload.preferred_username &&
      typeof payload.preferred_username === "string"
    ) {
      return payload.preferred_username
    }

    if (payload.sub.includes("github")) {
      const parts = payload.sub.split("|")
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1]
        if (!/^\d+$/.test(lastPart)) {
          return lastPart
        }
      }
    }

    return undefined
  }
}
