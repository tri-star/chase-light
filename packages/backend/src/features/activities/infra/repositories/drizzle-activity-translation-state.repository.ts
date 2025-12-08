import { and, eq } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { activities, userWatches } from "../../../../db/schema"
import {
  ACTIVITY_BODY_TRANSLATION_STATUS,
  type ActivityBodyTranslationStatus,
  type ActivityBodyTranslationState,
} from "../../domain"
import type {
  ActivityTranslationStateRepository,
  ActivityBodyTranslationStateUpdate,
  MarkActivityBodyTranslationCompletedInput,
  MarkActivityBodyTranslationFailedInput,
  MarkActivityBodyTranslationProcessingInput,
  MarkActivityBodyTranslationQueuedInput,
} from "../../domain/repositories/activity-translation-state.repository"

type ActivityTranslationRow = {
  activityId: string
  body: string
  translationStatus: ActivityBodyTranslationStatus
  translationStatusDetail: string | null
  translationRequestedAt: Date
  translationStartedAt: Date | null
  translationCompletedAt: Date | null
  translationMessageId: string | null
  translatedBody: string | null
}

export class DrizzleActivityTranslationStateRepository
  implements ActivityTranslationStateRepository
{
  async findByActivityId(
    activityId: string,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const row = await connection
      .select(this.baseSelect())
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1)
      .then((rows) => rows[0] as ActivityTranslationRow | undefined)

    return row ? this.mapToDomain(row) : null
  }

  async findByUserAndActivityId(
    userId: string,
    activityId: string,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const row = await connection
      .select(this.baseSelect())
      .from(activities)
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .where(and(eq(userWatches.userId, userId), eq(activities.id, activityId)))
      .limit(1)
      .then((rows) => rows[0] as ActivityTranslationRow | undefined)

    return row ? this.mapToDomain(row) : null
  }

  async updateTranslationState(
    activityId: string,
    state: Partial<ActivityBodyTranslationStateUpdate>,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        translatedBody: state.translatedBody,
        bodyTranslationStatus: state.translationStatus,
        bodyTranslationStatusDetail: state.translationStatusDetail,
        bodyTranslationRequestedAt: state.translationRequestedAt,
        bodyTranslationStartedAt: state.translationStartedAt,
        bodyTranslationCompletedAt: state.translationCompletedAt,
        bodyTranslationMessageId: state.translationMessageId,
      })
      .where(eq(activities.id, activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  async markQueued(
    input: MarkActivityBodyTranslationQueuedInput,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED,
        bodyTranslationStatusDetail: input.statusDetail ?? null,
        bodyTranslationRequestedAt: input.requestedAt,
        bodyTranslationStartedAt: null,
        bodyTranslationCompletedAt: null,
        bodyTranslationMessageId: input.messageId ?? null,
      })
      .where(eq(activities.id, input.activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  async markProcessing(
    input: MarkActivityBodyTranslationProcessingInput,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
        bodyTranslationStatusDetail: input.statusDetail ?? null,
        bodyTranslationStartedAt: input.startedAt,
        bodyTranslationMessageId: input.messageId ?? null,
      })
      .where(eq(activities.id, input.activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  async markCompleted(
    input: MarkActivityBodyTranslationCompletedInput,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        translatedBody: input.translatedBody,
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
        bodyTranslationStatusDetail: input.statusDetail ?? null,
        bodyTranslationCompletedAt: input.completedAt,
      })
      .where(eq(activities.id, input.activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  async markFailed(
    input: MarkActivityBodyTranslationFailedInput,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
        bodyTranslationStatusDetail: input.statusDetail ?? null,
        bodyTranslationCompletedAt: input.completedAt ?? null,
      })
      .where(eq(activities.id, input.activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  async updateStatusDetail(
    activityId: string,
    statusDetail: string | null,
  ): Promise<ActivityBodyTranslationState | null> {
    const connection = await TransactionManager.getConnection()

    const [row] = await connection
      .update(activities)
      .set({
        bodyTranslationStatusDetail: statusDetail,
      })
      .where(eq(activities.id, activityId))
      .returning(this.baseSelect())

    return row ? this.mapToDomain(row as ActivityTranslationRow) : null
  }

  private baseSelect() {
    return {
      activityId: activities.id,
      body: activities.body,
      translationStatus: activities.bodyTranslationStatus,
      translationStatusDetail: activities.bodyTranslationStatusDetail,
      translationRequestedAt: activities.bodyTranslationRequestedAt,
      translationStartedAt: activities.bodyTranslationStartedAt,
      translationCompletedAt: activities.bodyTranslationCompletedAt,
      translationMessageId: activities.bodyTranslationMessageId,
      translatedBody: activities.translatedBody,
    }
  }

  private mapToDomain(row: ActivityTranslationRow): ActivityBodyTranslationState {
    return {
      activityId: row.activityId,
      body: row.body,
      translationStatus: row.translationStatus as ActivityBodyTranslationStatus,
      translationStatusDetail: row.translationStatusDetail,
      translationRequestedAt: row.translationRequestedAt,
      translationStartedAt: row.translationStartedAt,
      translationCompletedAt: row.translationCompletedAt,
      translationMessageId: row.translationMessageId,
      translatedBody: row.translatedBody,
    }
  }
}
