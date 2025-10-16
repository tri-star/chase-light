/**
 * Notification repository port
 */

import type {
  Notification,
  NotificationId,
  UserId,
  ActivityId,
  UpsertNotificationInput,
} from "../notification"

export interface NotificationRepository {
  /**
   * Upsert a notification record
   * If a record with the same (userId, activityId) exists and status is 'pending', update it
   * If status is 'sent' or 'failed', do not update
   * Otherwise, insert a new record
   */
  upsertNotification(input: UpsertNotificationInput): Promise<Notification>

  /**
   * Upsert multiple notification records in a single transaction
   */
  upsertMany(inputs: UpsertNotificationInput[]): Promise<Notification[]>

  /**
   * Find a notification by user ID and activity ID
   */
  findByUserAndActivity(
    userId: UserId,
    activityId: ActivityId,
  ): Promise<Notification | null>

  /**
   * Find a notification by ID
   */
  findById(id: NotificationId): Promise<Notification | null>
}
