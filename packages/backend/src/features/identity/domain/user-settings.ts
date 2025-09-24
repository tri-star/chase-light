import { SupportedLanguage } from "../constants/identity.constants"

export type UserSettings = {
  emailNotifications: boolean
  pushNotifications: boolean
  language: SupportedLanguage
}
