import type { NotificationTarget } from "../notification-target"

export type FindNotificationTargetsParams = {
  limit: number
  activityIds?: string[]
}

export interface NotificationPreparationRepository {
  findPendingTargets(
    params: FindNotificationTargetsParams,
  ): Promise<NotificationTarget[]>
}
