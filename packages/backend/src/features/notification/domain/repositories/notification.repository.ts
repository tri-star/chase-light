import type { NotificationDraft } from "../notification"

export type CreateNotificationsResult = {
  created: number
  skippedByConflict: number
}

export interface NotificationRepository {
  createMany(drafts: NotificationDraft[]): Promise<CreateNotificationsResult>
}
