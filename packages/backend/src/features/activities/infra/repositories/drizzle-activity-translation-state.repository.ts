import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { TransactionManager } from "../../../../core/db"
import { activities, userWatches } from "../../../../db/schema"
import { ACTIVITY_BODY_TRANSLATION_STATUS } from "shared/constants"
import type {
  ActivityTranslationStateRepository,
  ActivityBodyTranslationStateUpdate,
  MarkActivityBodyTranslationCompletedInput,
  MarkActivityBodyTranslationFailedInput,
  MarkActivityBodyTranslationProcessingInput,
  MarkActivityBodyTranslationQueuedInput,
} from "../../domain/repositories/activity-translation-state.repository"
import { ActivityBodyTranslationState } from "../../domain"

/**
 * DBから返却される翻訳状態の行をバリデーションするためのZodスキーマ
 * ランタイムでDBレスポンスの型を検証し、型の不整合を検知する
 */
const activityTranslationRowSchema = z.object({
  activityId: z.string(),
  body: z.string(),
  translationStatus: z.enum([
    ACTIVITY_BODY_TRANSLATION_STATUS.IDLE,
    ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED,
    ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
    ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
    ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
  ]),
  translationStatusDetail: z.string().nullable(),
  translationRequestedAt: z.date(),
  translationStartedAt: z.date().nullable(),
  translationCompletedAt: z.date().nullable(),
  translationMessageId: z.string().nullable(),
  translatedBody: z.string().nullable(),
})

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
      .then((rows) => rows[0])

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
      .then((rows) => rows[0])

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

    return row ? this.mapToDomain(row) : null
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

    return row ? this.mapToDomain(row) : null
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

    return row ? this.mapToDomain(row) : null
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

    return row ? this.mapToDomain(row) : null
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

    return row ? this.mapToDomain(row) : null
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

    return row ? this.mapToDomain(row) : null
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

  /**
   * DBから取得した行をドメインオブジェクトに変換する
   * zodスキーマでバリデーションを行い、型の不整合を検知する
   *
   * @param row - DBから取得した行（unknown型で受け取り、zodでバリデーション）
   * @returns バリデーション済みのドメインオブジェクト
   * @throws ZodError - DBレスポンスがスキーマに一致しない場合
   */
  private mapToDomain(row: unknown): ActivityBodyTranslationState {
    const validated = activityTranslationRowSchema.parse(row)
    return {
      activityId: validated.activityId,
      body: validated.body,
      translationStatus: validated.translationStatus,
      translationStatusDetail: validated.translationStatusDetail,
      translationRequestedAt: validated.translationRequestedAt,
      translationStartedAt: validated.translationStartedAt,
      translationCompletedAt: validated.translationCompletedAt,
      translationMessageId: validated.translationMessageId,
      translatedBody: validated.translatedBody,
    }
  }
}
