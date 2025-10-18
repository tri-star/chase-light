import { eq, inArray } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { users, userPreferences } from "../../../../db/schema"
import type { Recipient } from "../../domain/recipient"
import type { UserId } from "../../domain/notification"
import { toUserId } from "../../domain/notification"
import type { RecipientRepository } from "../../domain/repositories/recipient.repository"

/**
 * Recipient repository implementation using Drizzle ORM
 */
export class DrizzleRecipientRepository implements RecipientRepository {
  /**
   * Find a recipient (user with notification preferences) by user ID
   */
  async findById(userId: UserId): Promise<Recipient | null> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        digestNotificationTimes: userPreferences.digestNotificationTimes,
      })
      .from(users)
      .leftJoin(userPreferences, eq(users.id, userPreferences.userId))
      .where(eq(users.id, userId))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return this.mapToDomain(results[0])
  }

  /**
   * Find multiple recipients by user IDs
   */
  async findMany(userIds: UserId[]): Promise<Recipient[]> {
    if (userIds.length === 0) {
      return []
    }

    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        digestNotificationTimes: userPreferences.digestNotificationTimes,
      })
      .from(users)
      .leftJoin(userPreferences, eq(users.id, userPreferences.userId))
      .where(inArray(users.id, userIds))

    return results.map(this.mapToDomain)
  }

  /**
   * Map database result to domain entity
   */
  private mapToDomain(row: {
    id: string
    email: string
    name: string
    timezone: string
    digestNotificationTimes: string[] | null
  }): Recipient {
    return {
      id: toUserId(row.id),
      email: row.email,
      name: row.name,
      timezone: row.timezone,
      digestNotificationTimes: row.digestNotificationTimes || ["18:00"],
    }
  }
}
