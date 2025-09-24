import { UserError } from "../errors/user.error"

/**
 * タイムゾーンバリデーション関数
 */
export function validateTimezone(timezone: string | undefined): void {
  if (timezone !== undefined) {
    if (timezone === "") {
      throw UserError.invalidTimezone(timezone)
    }
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      throw UserError.invalidTimezone(timezone)
    }
  }
}
