import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../core/db"
import { userWatches } from "../../../db/schema"
import type {
  UserWatch,
  UserWatchCreationInput,
  UserWatchUpdateInput,
} from "../domain"

/**
 * ユーザーウォッチのリポジトリクラス
 * 既存のUserRepositoryパターンに従った実装
 */
export class UserWatchRepository {
  /**
   * ユーザーウォッチを保存（作成・更新）
   */
  async save(data: UserWatchCreationInput): Promise<UserWatch> {
    const now = new Date()
    const id = data.id ?? randomUUID()
    const addedAt = data.addedAt ?? now

    const [result] = await (await TransactionManager.getConnection())
      .insert(userWatches)
      .values({
        id,
        userId: data.userId,
        dataSourceId: data.dataSourceId,
        notificationEnabled: data.notificationEnabled,
        watchReleases: data.watchReleases,
        watchIssues: data.watchIssues,
        watchPullRequests: data.watchPullRequests,
        addedAt,
      })
      .onConflictDoUpdate({
        target: [userWatches.userId, userWatches.dataSourceId],
        set: {
          notificationEnabled: data.notificationEnabled,
          watchReleases: data.watchReleases,
          watchIssues: data.watchIssues,
          watchPullRequests: data.watchPullRequests,
        },
      })
      .returning()

    return this.mapToDomain(result)
  }

  /**
   * IDでユーザーウォッチを検索
   */
  async findById(id: string): Promise<UserWatch | null> {
    const result = await (await TransactionManager.getConnection())
      .select()
      .from(userWatches)
      .where(eq(userWatches.id, id))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * ユーザーIDとデータソースIDでユーザーウォッチを検索
   */
  async findByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<UserWatch | null> {
    const result = await (await TransactionManager.getConnection())
      .select()
      .from(userWatches)
      .where(
        and(
          eq(userWatches.userId, userId),
          eq(userWatches.dataSourceId, dataSourceId),
        ),
      )

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * ユーザーIDで複数のユーザーウォッチを検索
   */
  async findByUserId(userId: string): Promise<UserWatch[]> {
    const results = await (await TransactionManager.getConnection())
      .select()
      .from(userWatches)
      .where(eq(userWatches.userId, userId))

    return results.map(this.mapToDomain)
  }

  /**
   * ユーザーウォッチを削除
   */
  async delete(id: string): Promise<boolean> {
    const result = await (await TransactionManager.getConnection())
      .delete(userWatches)
      .where(eq(userWatches.id, id))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * ユーザーIDとデータソースIDで削除
   */
  async deleteByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<boolean> {
    const result = await (await TransactionManager.getConnection())
      .delete(userWatches)
      .where(
        and(
          eq(userWatches.userId, userId),
          eq(userWatches.dataSourceId, dataSourceId),
        ),
      )

    return (result.rowCount ?? 0) > 0
  }

  /**
   * ユーザーIDとデータソースIDでユーザーウォッチを更新
   */
  async updateByUserAndDataSource(
    userId: string,
    dataSourceId: string,
    updateData: UserWatchUpdateInput,
  ): Promise<UserWatch | null> {
    // 更新用オブジェクト作成
    const updateFields: Partial<typeof userWatches.$inferInsert> = {}

    // 指定されたフィールドのみ更新
    if (updateData.notificationEnabled !== undefined) {
      updateFields.notificationEnabled = updateData.notificationEnabled
    }
    if (updateData.watchReleases !== undefined) {
      updateFields.watchReleases = updateData.watchReleases
    }
    if (updateData.watchIssues !== undefined) {
      updateFields.watchIssues = updateData.watchIssues
    }
    if (updateData.watchPullRequests !== undefined) {
      updateFields.watchPullRequests = updateData.watchPullRequests
    }

    // 更新するフィールドがない場合は現在の値を返す
    if (Object.keys(updateFields).length === 0) {
      return this.findByUserAndDataSource(userId, dataSourceId)
    }

    // 更新実行
    const [result] = await (await TransactionManager.getConnection())
      .update(userWatches)
      .set(updateFields)
      .where(
        and(
          eq(userWatches.userId, userId),
          eq(userWatches.dataSourceId, dataSourceId),
        ),
      )
      .returning()

    return result ? this.mapToDomain(result) : null
  }

  /**
   * データベース結果をドメイン型に変換
   */
  private mapToDomain(row: typeof userWatches.$inferSelect): UserWatch {
    return {
      id: row.id,
      userId: row.userId,
      dataSourceId: row.dataSourceId,
      notificationEnabled: row.notificationEnabled,
      watchReleases: row.watchReleases,
      watchIssues: row.watchIssues,
      watchPullRequests: row.watchPullRequests,
      addedAt: row.addedAt!,
    }
  }
}
