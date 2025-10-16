/**
 * Recipient repository port
 */

import type { Recipient } from "../recipient"
import type { UserId } from "../notification"

export interface RecipientRepository {
  /**
   * Find a recipient (user with notification preferences) by user ID
   */
  findById(userId: UserId): Promise<Recipient | null>

  /**
   * Find multiple recipients by user IDs
   */
  findMany(userIds: UserId[]): Promise<Recipient[]>
}
