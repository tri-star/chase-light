import type { UserRepository } from "../../domain/repositories/user.repository"
import { UserSettings } from "../../domain/user-settings"
import {
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_TIMEZONE,
  DEFAULT_LANGUAGE,
  DEFAULT_NOTIFICATIONS,
} from "../../constants/identity.constants"
import { validateTimezone } from "../../domain/timezone"
import { UserError } from "../../errors/user.error"

export type UpdateUserSettingsInputDto = {
  userId: string
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  language?: SupportedLanguage
}

export type ResetUserSettingsInputDto = {
  userId: string
}

export type UpdateUserSettingsOutputDto = UserSettings | null

/**
 * ユーザー設定更新ユースケース
 * 設定情報の更新・リセットに特化
 */
export class UpdateUserSettingsUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * ユーザー設定更新
   */
  async updateUserSettings(
    input: UpdateUserSettingsInputDto,
  ): Promise<UpdateUserSettingsOutputDto> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      return null
    }

    // タイムゾーンの検証
    validateTimezone(input.timezone)

    // 言語コードの検証
    if (input.language) {
      if (!SUPPORTED_LANGUAGES.includes(input.language)) {
        throw UserError.unsupportedLanguage(input.language)
      }
    }

    // 現在はtimezoneのみDBに保存
    if (input.timezone) {
      await this.userRepository.save({
        ...user,
        timezone: input.timezone,
      })
    }

    // TODO: 将来的にuser_settingsテーブルに他の設定も保存
    // if (input.emailNotifications !== undefined || input.pushNotifications !== undefined || input.language) {
    //   await this.userSettingsRepository.upsert(input.userId, {
    //     emailNotifications: input.emailNotifications,
    //     pushNotifications: input.pushNotifications,
    //     language: input.language,
    //   })
    // }

    // 更新後の設定を返却
    return this.getUserSettings(input.userId)
  }

  /**
   * 設定のリセット（デフォルト値に戻す）
   */
  async resetUserSettings(
    input: ResetUserSettingsInputDto,
  ): Promise<UpdateUserSettingsOutputDto> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      return null
    }

    // デフォルト設定に戻す
    await this.userRepository.save({
      ...user,
      timezone: DEFAULT_TIMEZONE,
    })

    return this.getUserSettings(input.userId)
  }

  /**
   * ユーザー設定取得（内部用）
   */
  private async getUserSettings(userId: string): Promise<UserSettings | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // デフォルト設定値を含むレスポンス（timezoneはuser objectに含まれるため除外）
    return {
      emailNotifications: DEFAULT_NOTIFICATIONS.emailNotifications, // 将来的にDBに保存
      pushNotifications: DEFAULT_NOTIFICATIONS.pushNotifications, // 将来的にDBに保存
      language: DEFAULT_LANGUAGE, // 将来的にDBに保存
    }
  }
}
