import type { UserRepository } from "../../domain/repositories/user.repository"
import { UserSettings } from "../../domain/user-settings"
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NOTIFICATIONS,
} from "../../constants/identity.constants"

export type GetUserSettingsInputDto = {
  userId: string
}

export type GetUserSettingsOutputDto = UserSettings | null

/**
 * ユーザー設定取得ユースケース
 * 設定情報の取得に特化
 */
export class GetUserSettingsUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * ユーザー設定取得
   * 現在はusersテーブルから取得、将来的にuser_settingsテーブルに分離予定
   */
  async getUserSettings(
    input: GetUserSettingsInputDto,
  ): Promise<GetUserSettingsOutputDto> {
    const user = await this.userRepository.findById(input.userId)
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
