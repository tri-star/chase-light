import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"
import { db } from "../../../db/connection"
import { dataSources } from "../../../db/schema"
import type { DataSource, DataSourceCreationInput } from "../domain"

/**
 * データソースのリポジトリクラス
 * 既存のUserRepositoryパターンに従った実装
 */
export class DataSourceRepository {
  /**
   * データソースを保存（作成・更新）
   */
  async save(data: DataSourceCreationInput): Promise<DataSource> {
    const now = new Date()
    const id = randomUUID()

    const [result] = await db
      .insert(dataSources)
      .values({
        id,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        name: data.name,
        description: data.description,
        url: data.url,
        isPrivate: data.isPrivate,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [dataSources.sourceType, dataSources.sourceId],
        set: {
          name: data.name,
          description: data.description,
          url: data.url,
          isPrivate: data.isPrivate,
          updatedAt: now,
        },
      })
      .returning()

    return this.mapToDomain(result)
  }

  /**
   * IDでデータソースを検索
   */
  async findById(id: string): Promise<DataSource | null> {
    const result = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, id))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * ソースタイプとソースIDでデータソースを検索
   */
  async findBySourceTypeAndId(
    sourceType: string,
    sourceId: string,
  ): Promise<DataSource | null> {
    const result = await db
      .select()
      .from(dataSources)
      .where(
        and(
          eq(dataSources.sourceType, sourceType),
          eq(dataSources.sourceId, sourceId),
        ),
      )

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * 複数のデータソースを検索
   */
  async findMany(filters?: { sourceType?: string }): Promise<DataSource[]> {
    let query = db.select().from(dataSources).$dynamic()

    if (filters?.sourceType) {
      query = query.where(eq(dataSources.sourceType, filters.sourceType))
    }

    const results = await query
    return results.map(this.mapToDomain)
  }

  /**
   * データソースを削除
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(dataSources).where(eq(dataSources.id, id))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * データベース結果をドメイン型に変換
   */
  private mapToDomain(row: typeof dataSources.$inferSelect): DataSource {
    return {
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      name: row.name,
      description: row.description,
      url: row.url,
      isPrivate: row.isPrivate,
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
    }
  }
}
