import { eq, and, desc, sql, inArray } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../../core/db"
import { events } from "../../../../db/schema"
import {
  type ActivityStatus,
  type ActivityType,
  type Activity,
  ACTIVITY_STATUS,
} from "../../domain/activity"
import { ActivityRepository } from "../../domain/repositories/activity.repository"

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
    dataSourceId: string
    githubEventId: string
    activityType: ActivityType
    title: string
    body: string
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
      dataSourceId: data.dataSourceId,
      githubEventId: data.githubEventId,
      eventType: data.activityType,
      title: data.title,
      body: data.body,
      version: data.version ?? null,
      status: data.status || ACTIVITY_STATUS.PENDING,
      statusDetail: data.statusDetail ?? null,
      githubData: data.githubData ?? null,
      createdAt: data.createdAt,
      updatedAt: now,
    } as const

    // onConflictDoUpdateでアトミックにupsert
    const [result] = await connection
      .insert(events)
      .values(insertData)
      .onConflictDoUpdate({
        target: [events.dataSourceId, events.githubEventId, events.eventType],
        set: {
          title: insertData.title,
          body: insertData.body,
          version: insertData.version,
          status: insertData.status,
          statusDetail: insertData.statusDetail,
          githubData: insertData.githubData,
          updatedAt: insertData.updatedAt,
        },
      })
      .returning({ id: events.id })

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
      dataSourceId: string
      githubEventId: string
      activityType: ActivityType
      title: string
      body: string
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
      dataSourceId: data.dataSourceId,
      githubEventId: data.githubEventId,
      eventType: data.activityType, // TODO: eventType -> activityType に統一。別フェーズで実施する
      title: data.title,
      body: data.body,
      version: data.version ?? null,
      status: data.status || ACTIVITY_STATUS.PENDING,
      statusDetail: data.statusDetail ?? null,
      githubData: data.githubData ?? null,
      createdAt: data.createdAt,
      updatedAt: now,
    }))

    // バルクinsert+onConflictDoUpdate
    const results = await connection
      .insert(events)
      .values(insertDataList)
      .onConflictDoUpdate({
        target: [events.dataSourceId, events.githubEventId, events.eventType],
        set: {
          title: sql`excluded.title`,
          body: sql`excluded.body`,
          version: sql`excluded.version`,
          status: sql`excluded.status`,
          statusDetail: sql`excluded.status_detail`,
          githubData: sql`excluded.github_data`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning({ id: events.id })

    // 新規作成か既存更新かは判別できないため、全idをnewEventIdsに入れる
    return {
      newActivityIds: results.map((r: (typeof results)[number]) => r.id),
      updatedCount: 0,
    }
  }

  /**
   * 指定されたデータソースの最新イベントのcreatedAtを取得
   * 初回実行時はnullを返す
   */
  async getLastCheckTimeForDataSource(
    dataSourceId: string,
  ): Promise<Date | null> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select({ createdAt: events.createdAt })
      .from(events)
      .where(eq(events.dataSourceId, dataSourceId))
      .orderBy(desc(events.createdAt))
      .limit(1)

    return result.length > 0 ? result[0].createdAt : null
  }

  /**
   * IDリストによる複数イベントの取得
   */
  async findByIds(eventIds: string[]): Promise<Activity[]> {
    if (eventIds.length === 0) {
      return []
    }

    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(events)
      .where(inArray(events.id, eventIds))
      .orderBy(desc(events.createdAt))

    return results.map(this.mapToDomain)
  }

  /**
   * イベントのステータスを更新
   */
  async updateStatus(
    eventId: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(events)
      .set({
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(eq(events.id, eventId))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * 翻訳結果とステータスを更新
   */
  async updateWithTranslation(
    eventId: string,
    translatedTitle: string,
    translatedBody: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(events)
      .set({
        title: translatedTitle,
        body: translatedBody,
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(eq(events.id, eventId))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * 複数イベントのステータスを一括更新
   */
  async updateStatusBatch(
    eventIds: string[],
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<number> {
    if (eventIds.length === 0) {
      return 0
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const result = await connection
      .update(events)
      .set({
        status,
        statusDetail,
        updatedAt: now,
      })
      .where(inArray(events.id, eventIds))

    return result.rowCount ?? 0
  }

  /**
   * IDでイベントを取得
   */
  async findById(id: string): Promise<Activity | null> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select()
      .from(events)
      .where(eq(events.id, id))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * データソースIDとステータスでイベントを取得
   */
  async findByDataSourceAndStatus(
    dataSourceId: string,
    status: ActivityStatus,
    limit = 100,
  ): Promise<Activity[]> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(events)
      .where(
        and(eq(events.dataSourceId, dataSourceId), eq(events.status, status)),
      )
      .orderBy(desc(events.createdAt))
      .limit(limit)

    return results.map(this.mapToDomain)
  }

  /**
   * 指定期間内のイベント数を取得（統計用）
   */
  async countByDataSourceAndDateRange(
    dataSourceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const connection = await TransactionManager.getConnection()

    const result = await connection
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(
        and(
          eq(events.dataSourceId, dataSourceId),
          sql`${events.createdAt} >= ${startDate}`,
          sql`${events.createdAt} <= ${endDate}`,
        ),
      )

    return Number(result[0].count)
  }

  /**
   * データベース結果をドメイン型に変換
   */
  private mapToDomain(row: typeof events.$inferSelect): Activity {
    return {
      id: row.id,
      dataSourceId: row.dataSourceId,
      githubEventId: row.githubEventId,
      activityType: row.eventType as ActivityType,
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status as ActivityStatus,
      statusDetail: row.statusDetail,
      githubData: row.githubData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
