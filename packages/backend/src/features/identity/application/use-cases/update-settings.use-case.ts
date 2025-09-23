import {
  DEFAULT_LANGUAGE,
  DEFAULT_NOTIFICATIONS,
  SUPPORTED_LANGUAGES,
} from "../../constants"
import type { User } from "../../domain/user"
import type { UserSettings } from "../../domain/user-settings"
import { validateTimezone } from "../../domain/timezone"
import type { UserRepository } from "../../domain/repositories/user.repository"
import { UserError } from "../../errors/user.error"
import type { SupportedLanguage } from "../../constants"

export interface UpdateSettingsInput {
  userId: string
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  language?: SupportedLanguage
}

export interface UpdateSettingsResult {
  user: User
  settings: UserSettings & { timezone: string }
}

export class UpdateSettingsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: UpdateSettingsInput,
  ): Promise<UpdateSettingsResult | null> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      return null
    }

    validateTimezone(input.timezone)

    if (input.language && !SUPPORTED_LANGUAGES.includes(input.language)) {
      throw UserError.unsupportedLanguage(input.language)
    }

    const timezone = input.timezone ?? user.timezone
    if (timezone !== user.timezone) {
      const updatedAt = new Date()
      await this.userRepository.save({
        ...user,
        timezone,
        updatedAt,
      })
    }

    const refreshedUser = await this.userRepository.findById(user.id)
    if (!refreshedUser) {
      throw UserError.settingsUpdateFailed("ユーザー情報の読み直しに失敗しました")
    }

    const settings: UserSettings & { timezone: string } = {
      timezone: refreshedUser.timezone,
      emailNotifications: DEFAULT_NOTIFICATIONS.emailNotifications,
      pushNotifications: DEFAULT_NOTIFICATIONS.pushNotifications,
      language: DEFAULT_LANGUAGE,
    }

    return {
      user: refreshedUser,
      settings,
    }
  }
}
