import type { Recipient } from "./recipient"

export type NotificationTarget = {
  activity: {
    id: string
    type: string
    createdAt: Date
    dataSourceId: string
    dataSourceName: string
    title: string
  }
  recipient: Recipient
}
