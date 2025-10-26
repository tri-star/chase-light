export const NOTIFICATIONS_CURSOR_DELIMITER = "|"

export const NOTIFICATIONS_ERROR = {
  INVALID_CURSOR: "NOTIFICATIONS_INVALID_CURSOR",
} as const

export const NOTIFICATIONS_READ_FILTER = {
  ALL: "all",
  READ: "read",
  UNREAD: "unread",
} as const

export type NotificationReadFilter =
  (typeof NOTIFICATIONS_READ_FILTER)[keyof typeof NOTIFICATIONS_READ_FILTER]

export const NOTIFICATIONS_DEFAULT_LIMIT = 20
export const NOTIFICATIONS_MAX_LIMIT = 50
export const NOTIFICATIONS_MIN_LIMIT = 1
export const NOTIFICATIONS_SEARCH_MAX_LENGTH = 120
