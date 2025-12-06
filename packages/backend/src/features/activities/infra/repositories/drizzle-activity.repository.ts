import { and, asc, eq, inArray } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { activities, userWatches } from "../../../../db/schema"
import type { Activity, ActivityBodyTranslationStatus } from "../../domain"
import type {
  ActivityRepository,
  TranslationStateUpdate,
} from "../../domain/repositories/activity.repository"

const translateStatusColumn = activities.bodyTranslationStatus

export class DrizzleActivityRepository implements ActivityRepository {
  async findByIdWithWatch(
    activityId: string,
    userId: string,
  ): Promise<Activity | null> {
    const connection = await TransactionManager.getConnection()
    const [row] = await connection
      .select()
      .from(activities)
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .where(and(eq(activities.id, activityId), eq(userWatches.userId, userId)))
      .limit(1)

    if (!row) {
      return null
    }

    return this.mapToDomain(row.activities)
  }

  async findById(activityId: string): Promise<Activity | null> {
    const connection = await TransactionManager.getConnection()
    const [row] = await connection
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1)

    return row ? this.mapToDomain(row) : null
  }

  async findPendingBodyTranslations(limit: number): Promise<Activity[]> {
    const connection = await TransactionManager.getConnection()
    const rows = await connection
      .select()
      .from(activities)
      .where(eq(translateStatusColumn, "pending"))
      .orderBy(
        asc(activities.bodyTranslationRequestedAt),
        asc(activities.createdAt),
      )
      .limit(limit)

    return rows.map((row) => this.mapToDomain(row))
  }

  async updateBodyTranslationState(
    activityId: string,
    update: TranslationStateUpdate,
    allowedCurrentStatuses?: ActivityBodyTranslationStatus[],
  ): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const set: Record<string, unknown> = {
      updatedAt: now,
    }

    if ("status" in update && update.status !== undefined) {
      set.bodyTranslationStatus = update.status
    }
    if ("requestedAt" in update) {
      set.bodyTranslationRequestedAt = update.requestedAt ?? null
    }
    if ("startedAt" in update) {
      set.bodyTranslationStartedAt = update.startedAt ?? null
    }
    if ("completedAt" in update) {
      set.bodyTranslationCompletedAt = update.completedAt ?? null
    }
    if ("error" in update) {
      set.bodyTranslationError = update.error ?? null
    }
    if ("translatedBody" in update) {
      set.translatedBody = update.translatedBody ?? null
    }
    if ("translatedTitle" in update) {
      set.translatedTitle = update.translatedTitle ?? null
    }
    if ("summary" in update) {
      set.summary = update.summary ?? null
    }

    const whereClause =
      allowedCurrentStatuses && allowedCurrentStatuses.length > 0
        ? and(
            eq(activities.id, activityId),
            inArray(translateStatusColumn, allowedCurrentStatuses),
          )
        : eq(activities.id, activityId)

    const result = await connection
      .update(activities)
      .set(set)
      .where(whereClause)

    return (result.rowCount ?? 0) > 0
  }

  private mapToDomain(row: typeof activities.$inferSelect): Activity {
    return {
      id: row.id,
      dataSourceId: row.dataSourceId,
      githubEventId: row.githubEventId,
      activityType: row.activityType as Activity["activityType"],
      title: row.title,
      body: row.body,
      translatedTitle: row.translatedTitle,
      summary: row.summary,
      translatedBody: row.translatedBody,
      version: row.version,
      bodyTranslationStatus:
        row.bodyTranslationStatus as ActivityBodyTranslationStatus,
      bodyTranslationRequestedAt: row.bodyTranslationRequestedAt,
      bodyTranslationStartedAt: row.bodyTranslationStartedAt,
      bodyTranslationCompletedAt: row.bodyTranslationCompletedAt,
      bodyTranslationError: row.bodyTranslationError,
      status: row.status as Activity["status"],
      statusDetail: row.statusDetail,
      githubData: row.githubData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
