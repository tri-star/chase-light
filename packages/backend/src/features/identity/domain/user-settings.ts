import type { SupportedLanguage } from "../constants"

export type UserSettings = {
  emailNotifications: boolean
  pushNotifications: boolean
  language: SupportedLanguage
}
