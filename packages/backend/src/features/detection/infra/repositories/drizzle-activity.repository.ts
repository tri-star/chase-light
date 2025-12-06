import { eq, and, desc, sql, inArray } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../../core/db"
import { activities } from "../../../../db/schema"
import {
  type ActivityStatus,
  type ActivityType,
  type Activity,
  type ActivityBodyTranslationStatus,
  ACTIVITY_STATUS,
} from "../../domain/activity"
import { ActivityRepository } from "../../domain/repositories/activity.repository"
import { DetectTargetId } from "../../domain/detect-target"

/**
 * アクティビティ情報の保存・更新を行うRepository
 */
export class DrizzleActivityRepository implements ActivityRepository {
  /**
   * 新規アクティビティの作成またはUpsert
   * GitHub event IDによる重複チェックを行い、既存の場合は更新する
   */
  async upsert(data: {
    id?: string
    detectTargetId: DetectTargetId
    githubEventId: string
    activityType: ActivityType
    title: string
    body: string
    translatedTitle?: string | null
    summary?: string | null
    translatedBody?: string | null
    version?: string | null
    status?: ActivityStatus
    statusDetail?: string | null
    githubData?: string | null
    createdAt: Date
  }): Promise<{ id: string; isNew: boolean }> {
    const now = new Date()
    const id = data.id || randomUUID()
    const connection = await TransactionManager.getConnection()

    const insertData = {
      id,
      dataSourceId: data.detectTargetId,
      githubEventId: data.githubEventId,
      activityType: data.activityType,
      title: data.title,
      body: data.body,
      translatedTitle: data.translatedTitle ?? null,
      summary: data.summary ?? null,
      translatedBody: data.translatedBody ?? null,
      version: data.version ?? null,
      status: data.status || ACTIVITY_STATUS.PENDING,
      statusDetail: data.statusDetail ?? null,
      githubData: data.githubData ?? null,
      createdAt: data.createdAt,
      updatedAt: now,
    } as const

    // onConflictDoUpdateでアトミックにupsert
    const [result] = await connection
      .insert(activities)
      .values(insertData)
      .onConflictDoUpdate({
        target: [
          activities.dataSourceId,
          activities.githubEventId,
          activities.activityType,
        ],
        set: {
          title: insertData.title,
          body: insertData.body,
          translatedTitle: insertData.translatedTitle,
          summary: insertData.summary,
          translatedBody: insertData.translatedBody,
          version: insertData.version,
          status: insertData.status,
          statusDetail: insertData.statusDetail,
          githubData: insertData.githubData,
          updatedAt: insertData.updatedAt,
        },
      })
      .returning({ id: activities.id })

    // result.idが既存か新規かは判別できないため、isNewは常にfalseにするか、必要なら別途工夫が必要
    // ここでは一旦isNew: falseで返す
    return { id: result.id, isNew: false }
  }

  /**
   * 複数イベントの一括Upsert
   */
  async upsertMany(
    dataList: Array<{
      id?: string
      detectTargetId: DetectTargetId
      githubEventId: string
      activityType: ActivityType
      title: string
      body: string
      translatedTitle?: string | null
      summary?: string | null
      translatedBody?: string | null
      version?: string | null
      status?: ActivityStatus
      statusDetail?: string | null
      githubData?: string | null
      createdAt: Date
    }>,
  ): Promise<{ newActivityIds: string[]; updatedCount: number }> {
    if (dataList.length === 0) {
      return { newActivityIds: [], updatedCount: 0 }
    }

    const now = new Date()
    const connection = await TransactionManager.getConnection()
    const insertDataList = dataList.map((data) => ({
      id: data.id || randomUUID(),
      dataSourceId: data.detectTargetId,
      githubEventId: data.githubEventId,
      activityType: data.activityType,
      title: data.title,
      body: data.body,
      translatedTitle: data.translatedTitle ?? null,
      summary: data.summary ?? null,
      translatedBody: data.translatedBody ?? null,
      version: data.version ?? null,
      status: data.status || ACTIVITY_STATUS.PENDING,
      statusDetail: data.statusDetail ?? null,
      githubData: data.githubData ?? null,
      createdAt: data.createdAt,
      updatedAt: now,
    }))

    // バルクinsert+onConflictDoUpdate
    const results = await connection
      .insert(activities)
      .values(insertDataList)
      .onConflictDoUpdate({
        target: [
          activities.dataSourceId,
          activities.githubEventId,
          activities.activityType,
        ],
        set: {
          title: sql`excluded.title`,
          body: sql`excluded.body`,
          translatedTitle: sql`excluded.translated_title`,
          summary: sql`excluded.summary`,
          translatedBody: sql`excluded.translated_body`,
          version: sql`excluded.version`,
          status: sql`excluded.status`,
          statusDetail: sql`excluded.status_detail`,
          githubData: sql`excluded.github_data`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning({ id: activities.id })

    // 新規作成か既存更新かは判別できないため、全idをnewEventIdsに入れる
    return {
      newActivityIds: results.map((r: (typeof results)[number]) => r.id),
      updatedCount: 0,
    }
  }

  /**
   * 指定されたデータソースの最新アクティビティのcreatedAtを取得
   * 初回実行時はnullを返す
   */
  async getLastCheckTimeForDataSource(
    dataSourceId: DetectTargetId,
  ): Promise<Date | null> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select({ createdAt: activities.createdAt })
      .from(activities)
      .where(eq(activities.dataSourceId, dataSourceId))
      .orderBy(desc(activities.createdAt))
      .limit(1)

    return result.length > 0 ? result[0].createdAt : null
  }

  /**
   * IDリストによる複数アクティビティの取得
   */
  async findByIds(activityIds: string[]): Promise<Activity[]> {
    if (activityIds.length === 0) {
      return []
    }

    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(activities)
      .where(inArray(activities.id, activityIds))
      .orderBy(desc(activities.createdAt))

    return results.map(this.mapToDomain)
  }

  /**
   * アクティビティのステータスを更新
   */
  async updateStatus(
    activityId: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(activities)
      .set({
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * 翻訳結果とステータスを更新
   */
  async updateWithTranslation(
    activityId: string,
    translatedTitle: string | null,
    summary: string | null,
    translatedBody: string | null,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(activities)
      .set({
        translatedTitle,
        summary,
        translatedBody,
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * 複数アクティビティのステータスを一括更新
   */
  async updateStatusBatch(
    activityIds: string[],
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<number> {
    if (activityIds.length === 0) {
      return 0
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(activities)
      .set({
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(inArray(activities.id, activityIds))

    return result.rowCount ?? 0
  }

  /**
   * IDでアクティビティを取得
   */
  async findById(id: string): Promise<Activity | null> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select()
      .from(activities)
      .where(eq(activities.id, id))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * データソースIDとステータスでアクティビティを取得
   */
  async findByDataSourceAndStatus(
    dataSourceId: string,
    status: ActivityStatus,
    limit = 100,
  ): Promise<Activity[]> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.dataSourceId, dataSourceId),
          eq(activities.status, status),
        ),
      )
      .orderBy(desc(activities.createdAt))
      .limit(limit)

    return results.map(this.mapToDomain)
  }

  /**
   * 指定期間内のアクティビティ数を取得（統計用）
   */
  async countByDataSourceAndDateRange(
    dataSourceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(
        and(
          eq(activities.dataSourceId, dataSourceId),
          sql`${activities.createdAt} >= ${startDate}`,
          sql`${activities.createdAt} <= ${endDate}`,
        ),
      )

    return Number(result[0].count)
  }

  /**
   * データベース結果をドメイン型に変換
   */
  private mapToDomain(row: typeof activities.$inferSelect): Activity {
    return {
      id: row.id,
      dataSourceId: row.dataSourceId,
      githubEventId: row.githubEventId,
      activityType: row.activityType as ActivityType,
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
      status: row.status as ActivityStatus,
      statusDetail: row.statusDetail,
      githubData: row.githubData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
