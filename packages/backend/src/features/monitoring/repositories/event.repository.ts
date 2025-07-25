import { eq, and, desc, sql, inArray } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../shared/db"
import { events } from "../../../db/schema"
import type { EventStatus } from "../domain/event-status"
import type { EventType } from "../domain/monitoring-types"

/**
 * イベント情報の保存・更新を行うRepository
 */
export class EventRepository {
  /**
   * 新規イベントの作成またはUpsert
   * GitHub event IDによる重複チェックを行い、既存の場合は更新する
   */
  async upsert(data: {
    id?: string
    dataSourceId: string
    githubEventId: string
    eventType: EventType
    title: string
    body: string
    version?: string | null
    status?: EventStatus
    statusDetail?: string | null
    githubData?: string | null
    createdAt: Date
  }): Promise<{ id: string; isNew: boolean }> {
    const now = new Date()
    const id = data.id || randomUUID()
    const connection = TransactionManager.getConnection()

    // 既存レコードのチェック
    const existing = await connection
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.dataSourceId, data.dataSourceId),
          eq(events.githubEventId, data.githubEventId),
          eq(events.eventType, data.eventType),
        ),
      )
    if (existing.length > 0) {
      // 既存レコードがある場合は更新
      const updateData: Record<string, unknown> = {
        title: data.title,
        body: data.body,
        status: data.status || "pending",
        updatedAt: now,
      }

      // オプショナルフィールドは値がある場合のみ追加
      if (data.version !== undefined) {
        updateData.version = data.version
      }
      if (data.statusDetail !== undefined) {
        updateData.statusDetail = data.statusDetail
      }
      if (data.githubData !== undefined) {
        updateData.githubData = data.githubData
      }

      await connection
        .update(events)
        .set(updateData)
        .where(eq(events.id, existing[0].id))

      return { id: existing[0].id, isNew: false }
    }

    // 新規作成
    const insertData = {
      id,
      dataSourceId: data.dataSourceId,
      githubEventId: data.githubEventId,
      eventType: data.eventType,
      title: data.title,
      body: data.body,
      version: data.version ?? null,
      status: data.status || "pending",
      statusDetail: data.statusDetail ?? null,
      githubData: data.githubData ?? null,
      createdAt: data.createdAt,
      updatedAt: now,
    } as const

    const [result] = await connection
      .insert(events)
      .values(insertData)
      .returning({ id: events.id })

    return { id: result.id, isNew: true }
  }

  /**
   * 複数イベントの一括Upsert
   */
  async upsertMany(
    dataList: Array<{
      id?: string
      dataSourceId: string
      githubEventId: string
      eventType: EventType
      title: string
      body: string
      version?: string | null
      status?: EventStatus
      statusDetail?: string | null
      githubData?: string | null
      createdAt: Date
    }>,
  ): Promise<{ newEventIds: string[]; updatedCount: number }> {
    const newEventIds: string[] = []
    let updatedCount = 0

    // トランザクション内で処理
    for (const data of dataList) {
      const result = await this.upsert(data)
      if (result.isNew) {
        newEventIds.push(result.id)
      } else {
        updatedCount++
      }
    }

    return { newEventIds, updatedCount }
  }

  /**
   * 指定されたデータソースの最新イベントのcreatedAtを取得
   * 初回実行時はnullを返す
   */
  async getLastCheckTimeForDataSource(
    dataSourceId: string,
  ): Promise<Date | null> {
    const connection = TransactionManager.getConnection()

    const result = await connection
      .select({ createdAt: events.createdAt })
      .from(events)
      .where(eq(events.dataSourceId, dataSourceId))
      .orderBy(desc(events.createdAt))
      .limit(1)

    return result.length > 0 ? result[0].createdAt : null
  }

  /**
   * イベントのステータスを更新
   */
  async updateStatus(
    eventId: string,
    status: EventStatus,
    statusDetail?: string | null,
  ): Promise<boolean> {
    const connection = TransactionManager.getConnection()
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
   * 複数イベントのステータスを一括更新
   */
  async updateStatusBatch(
    eventIds: string[],
    status: EventStatus,
    statusDetail?: string | null,
  ): Promise<number> {
    if (eventIds.length === 0) {
      return 0
    }

    const connection = TransactionManager.getConnection()
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
  async findById(id: string): Promise<Event | null> {
    const connection = TransactionManager.getConnection()

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
    status: EventStatus,
    limit = 100,
  ): Promise<Event[]> {
    const connection = TransactionManager.getConnection()

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
    const connection = TransactionManager.getConnection()

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
  private mapToDomain(row: typeof events.$inferSelect): Event {
    return {
      id: row.id,
      dataSourceId: row.dataSourceId,
      githubEventId: row.githubEventId,
      eventType: row.eventType as EventType,
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status as EventStatus,
      statusDetail: row.statusDetail,
      githubData: row.githubData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}

/**
 * イベントドメインモデル
 */
export interface Event {
  id: string
  dataSourceId: string
  githubEventId: string
  eventType: EventType
  title: string
  body: string
  version: string | null
  status: EventStatus
  statusDetail: string | null
  githubData: string | null
  createdAt: Date
  updatedAt: Date
}
