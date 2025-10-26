import { NOTIFICATIONS_ERROR } from "../constants/query.constants"

export class NotificationInvalidCursorError extends Error {
  readonly code = NOTIFICATIONS_ERROR.INVALID_CURSOR

  constructor(message = "カーソル形式が不正です") {
    super(message)
    this.name = "NotificationInvalidCursorError"
  }
}
