import { TIMEZONE_VALIDATION } from "../constants/user-validation.js"

/**
 * タイムゾーンバリデーション関数
 */
export function validateTimezone(timezone: string | undefined): void {
  if (timezone !== undefined) {
    if (timezone === "") {
      throw new Error(TIMEZONE_VALIDATION.INVALID_ERROR_MESSAGE)
    }
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      throw new Error(TIMEZONE_VALIDATION.INVALID_ERROR_MESSAGE)
    }
  }
}