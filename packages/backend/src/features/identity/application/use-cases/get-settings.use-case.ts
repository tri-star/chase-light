import {
  DEFAULT_LANGUAGE,
  DEFAULT_NOTIFICATIONS,
} from "../../constants"
import type { User } from "../../domain/user"
import type { UserSettings } from "../../domain/user-settings"
import type { UserRepository } from "../../domain/repositories/user.repository"

export interface GetSettingsInput {
  auth0UserId: string
}

export interface GetSettingsResult {
  user: User
  settings: UserSettings & { timezone: string }
}

export class GetSettingsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetSettingsInput): Promise<GetSettingsResult | null> {
    const user = await this.userRepository.findByAuth0Id(input.auth0UserId)
    if (!user) {
      return null
    }

    const settings: UserSettings & { timezone: string } = {
      timezone: user.timezone,
      emailNotifications: DEFAULT_NOTIFICATIONS.emailNotifications,
      pushNotifications: DEFAULT_NOTIFICATIONS.pushNotifications,
      language: DEFAULT_LANGUAGE,
    }

    return {
      user,
      settings,
    }
  }
}
