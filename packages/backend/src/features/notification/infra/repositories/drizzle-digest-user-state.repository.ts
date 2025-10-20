import { and, eq, isNull, or, sql } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import {
  notificationDigestUserStates,
  userPreferences,
  userWatches,
  users,
} from "../../../../db/schema"
import type {
  DigestUserState,
  DigestUserStateRepository,
  FetchDigestUserStatesParams,
  UpdateDigestUserStateInput,
} from "../../domain/repositories/digest-user-state.repository"

const DEFAULT_TIMEZONE = "UTC"

export class DrizzleDigestUserStateRepository
  implements DigestUserStateRepository
{
  async fetchUserStates(
    params: FetchDigestUserStatesParams,
  ): Promise<DigestUserState[]> {
    const connection = await TransactionManager.getConnection()
    const rows = await connection
      .select({
        userId: users.id,
        lastSuccessfulRunAt: notificationDigestUserStates.lastSuccessfulRunAt,
        lastAttemptedRunAt: notificationDigestUserStates.lastAttemptedRunAt,
        digestTimezone: userPreferences.digestTimezone,
        userTimezone: users.timezone,
      })
      .from(userWatches)
      .innerJoin(users, eq(userWatches.userId, users.id))
      .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
      .leftJoin(
        notificationDigestUserStates,
        eq(notificationDigestUserStates.userId, users.id),
      )
      .where(
        and(
          eq(userWatches.notificationEnabled, true),
          or(
            eq(userWatches.watchReleases, true),
            eq(userWatches.watchIssues, true),
            eq(userWatches.watchPullRequests, true),
          ),
          or(
            isNull(userPreferences.digestEnabled),
            eq(userPreferences.digestEnabled, true),
          ),
        ),
      )
      .groupBy(
        users.id,
        notificationDigestUserStates.lastSuccessfulRunAt,
        notificationDigestUserStates.lastAttemptedRunAt,
        userPreferences.digestTimezone,
        users.timezone,
      )
      .limit(params.limit)

    return rows.map((row) => ({
      userId: row.userId,
      lastSuccessfulRunAt: row.lastSuccessfulRunAt,
      lastAttemptedRunAt: row.lastAttemptedRunAt,
      timezone: row.digestTimezone ?? row.userTimezone ?? DEFAULT_TIMEZONE,
    }))
  }

  async updateUserStates(updates: UpdateDigestUserStateInput[]): Promise<void> {
    if (updates.length === 0) {
      return
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()

    await connection
      .insert(notificationDigestUserStates)
      .values(
        updates.map((update) => ({
          userId: update.userId,
          lastSuccessfulRunAt: update.lastSuccessfulRunAt,
          lastAttemptedRunAt: update.lastAttemptedRunAt,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: notificationDigestUserStates.userId,
        set: {
          lastSuccessfulRunAt: sql`excluded.last_successful_run_at`,
          lastAttemptedRunAt: sql`excluded.last_attempted_run_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
  }
}
