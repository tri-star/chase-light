import type {
  NotificationDetailQuery,
  NotificationListItem,
  NotificationListQuery,
  NotificationListResult,
} from "../notification-query"

export interface NotificationQueryRepository {
  list(query: NotificationListQuery): Promise<NotificationListResult>
  findById(query: NotificationDetailQuery): Promise<NotificationListItem | null>
}
