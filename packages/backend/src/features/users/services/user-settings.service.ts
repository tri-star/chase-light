import { UserRepository } from "../../../repositories/user.repository.js"

export interface UserSettings {
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  language: string
}

export interface UpdateSettingsRequest {
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  language?: string
}

/**
 * ユーザー設定管理サービス
 * 設定情報の取得・更新に特化
 */
export class UserSettingsService {
  constructor(private userRepository: UserRepository) {}

  /**
   * ユーザー設定取得
   * 現在はusersテーブルから取得、将来的にuser_settingsテーブルに分離予定
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // デフォルト設定値を含むレスポンス
    return {
      timezone: user.timezone,
      emailNotifications: true, // 将来的にDBに保存
      pushNotifications: false, // 将来的にDBに保存
      language: "ja", // 将来的にDBに保存
    }
  }

  /**
   * ユーザー設定更新
   */
  async updateUserSettings(
    userId: string,
    data: UpdateSettingsRequest,
  ): Promise<UserSettings | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // タイムゾーンの検証
    if (data.timezone !== undefined) {
      if (data.timezone === "") {
        throw new Error("無効なタイムゾーンです")
      }
      try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone })
      } catch {
        throw new Error("無効なタイムゾーンです")
      }
    }

    // 言語コードの検証
    if (data.language) {
      const supportedLanguages = ["ja", "en"]
      if (!supportedLanguages.includes(data.language)) {
        throw new Error("サポートされていない言語です")
      }
    }

    // 現在はtimezoneのみDBに保存
    if (data.timezone) {
      await this.userRepository.update(userId, {
        timezone: data.timezone,
      })
    }

    // TODO: 将来的にuser_settingsテーブルに他の設定も保存
    // if (data.emailNotifications !== undefined || data.pushNotifications !== undefined || data.language) {
    //   await this.userSettingsRepository.upsert(userId, {
    //     emailNotifications: data.emailNotifications,
    //     pushNotifications: data.pushNotifications,
    //     language: data.language,
    //   })
    // }

    // 更新後の設定を返却
    return this.getUserSettings(userId)
  }

  /**
   * 設定のリセット（デフォルト値に戻す）
   */
  async resetUserSettings(userId: string): Promise<UserSettings | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    // デフォルト設定に戻す
    await this.userRepository.update(userId, {
      timezone: "Asia/Tokyo",
    })

    return this.getUserSettings(userId)
  }
}

// シングルトンインスタンス
export const userSettingsService = new UserSettingsService(new UserRepository())
