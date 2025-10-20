import type { DigestNotificationDraft } from "../notification"

export type CreateDigestNotificationsResult = {
  created: number
  skippedByConflict: number
}

export interface DigestNotificationRepository {
  createMany(
    drafts: DigestNotificationDraft[],
  ): Promise<CreateDigestNotificationsResult>
}
