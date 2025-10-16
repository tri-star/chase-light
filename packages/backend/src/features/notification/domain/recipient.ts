/**
 * Recipient domain entity (User representation for notification purposes)
 */

import type { UserId } from "./notification"

export type Recipient = {
  id: UserId
  email: string
  name: string
  timezone: string
  digestNotificationTimes: string[] // ["18:00", "18:30"]
}
