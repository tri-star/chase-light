import { eq, and, ilike, or, gte, lte, sql, asc, desc, inArray } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../shared/db"
import {
  dataSources,
  repositories,
  userWatches,
  events,
  notifications,
} from "../../../db/schema"
import type {
  DataSource,
  DataSourceCreationInput,
  DataSourceUpdateInput,
  DataSourceListFilters,
  DataSourceListResult,
  DataSourceListItem,
} from "../domain"

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
    const connection = TransactionManager.getConnection()

    const [result] = await connection
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
    const connection = TransactionManager.getConnection()
    const result = await connection
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
    const connection = TransactionManager.getConnection()
    const result = await connection
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
    const connection = TransactionManager.getConnection()
    let query = connection.select().from(dataSources).$dynamic()

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
    const connection = TransactionManager.getConnection()
    const result = await connection
      .delete(dataSources)
      .where(eq(dataSources.id, id))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * ユーザーアクセス権限チェック付きでデータソースを更新
   */
  async updateByIdWithUserAccess(
    id: string,
    userId: string,
    updateData: DataSourceUpdateInput,
  ): Promise<DataSource | null> {
    const connection = TransactionManager.getConnection()
    // まず権限チェック - ユーザーがこのデータソースをウォッチしているか確認
    const accessCheck = await connection
      .select({ dataSourceId: dataSources.id })
      .from(dataSources)
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .where(and(eq(dataSources.id, id), eq(userWatches.userId, userId)))

    if (accessCheck.length === 0) {
      return null // アクセス権限なし
    }

    // 更新用オブジェクト作成
    const now = new Date()
    const updateFields: Partial<typeof dataSources.$inferInsert> = {
      updatedAt: now,
    }

    // 指定されたフィールドのみ更新
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name
    }
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description
    }

    // 更新実行
    const [result] = await connection
      .update(dataSources)
      .set(updateFields)
      .where(eq(dataSources.id, id))
      .returning()

    return result ? this.mapToDomain(result) : null
  }

  /**
   * ユーザーのアクセス権限を持つデータソースを詳細情報付きで取得
   */
  async findByIdWithUserAccess(
    id: string,
    userId: string,
  ): Promise<DataSourceListItem | null> {
    const connection = TransactionManager.getConnection()
    const results = await connection
      .select({
        // データソース
        dataSourceId: dataSources.id,
        dataSourceType: dataSources.sourceType,
        dataSourceSourceId: dataSources.sourceId,
        dataSourceName: dataSources.name,
        dataSourceDescription: dataSources.description,
        dataSourceUrl: dataSources.url,
        dataSourceIsPrivate: dataSources.isPrivate,
        dataSourceCreatedAt: dataSources.createdAt,
        dataSourceUpdatedAt: dataSources.updatedAt,
        // リポジトリ
        repositoryId: repositories.id,
        repositoryDataSourceId: repositories.dataSourceId,
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
        // ユーザーウォッチ
        userWatchId: userWatches.id,
        userWatchUserId: userWatches.userId,
        userWatchDataSourceId: userWatches.dataSourceId,
        userWatchNotificationEnabled: userWatches.notificationEnabled,
        userWatchWatchReleases: userWatches.watchReleases,
        userWatchWatchIssues: userWatches.watchIssues,
        userWatchWatchPullRequests: userWatches.watchPullRequests,
        userWatchAddedAt: userWatches.addedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .where(and(eq(dataSources.id, id), eq(userWatches.userId, userId)))

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    return {
      dataSource: {
        id: row.dataSourceId,
        sourceType: row.dataSourceType,
        sourceId: row.dataSourceSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
        isPrivate: row.dataSourceIsPrivate,
        createdAt: row.dataSourceCreatedAt,
        updatedAt: row.dataSourceUpdatedAt,
      },
      repository: {
        id: row.repositoryId,
        dataSourceId: row.repositoryDataSourceId,
        githubId: row.repositoryGithubId,
        fullName: row.repositoryFullName,
        owner: row.repositoryFullName.split("/")[0], // ownerフィールドを追加
        language: row.repositoryLanguage,
        starsCount: row.repositoryStarsCount,
        forksCount: row.repositoryForksCount,
        openIssuesCount: row.repositoryOpenIssuesCount,
        isFork: row.repositoryIsFork,
        createdAt: row.repositoryCreatedAt,
        updatedAt: row.repositoryUpdatedAt,
      },
      userWatch: {
        id: row.userWatchId,
        userId: row.userWatchUserId,
        dataSourceId: row.userWatchDataSourceId,
        notificationEnabled: row.userWatchNotificationEnabled,
        watchReleases: row.userWatchWatchReleases,
        watchIssues: row.userWatchWatchIssues,
        watchPullRequests: row.userWatchWatchPullRequests,
        addedAt: row.userWatchAddedAt,
      },
    }
  }

  /**
   * フィルタリング条件付きでユーザーのデータソースを取得
   */
  async findByUserWithFilters(
    userId: string,
    filters: DataSourceListFilters = {},
  ): Promise<DataSourceListResult> {
    const connection = TransactionManager.getConnection()
    // 基本的なクエリ構築
    let query = connection
      .select({
        // データソース
        dataSourceId: dataSources.id,
        dataSourceType: dataSources.sourceType,
        dataSourceSourceId: dataSources.sourceId,
        dataSourceName: dataSources.name,
        dataSourceDescription: dataSources.description,
        dataSourceUrl: dataSources.url,
        dataSourceIsPrivate: dataSources.isPrivate,
        dataSourceCreatedAt: dataSources.createdAt,
        dataSourceUpdatedAt: dataSources.updatedAt,
        // リポジトリ
        repositoryId: repositories.id,
        repositoryDataSourceId: repositories.dataSourceId,
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
        // ユーザーウォッチ
        userWatchId: userWatches.id,
        userWatchUserId: userWatches.userId,
        userWatchDataSourceId: userWatches.dataSourceId,
        userWatchNotificationEnabled: userWatches.notificationEnabled,
        userWatchWatchReleases: userWatches.watchReleases,
        userWatchWatchIssues: userWatches.watchIssues,
        userWatchWatchPullRequests: userWatches.watchPullRequests,
        userWatchAddedAt: userWatches.addedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .where(eq(userWatches.userId, userId))
      .$dynamic()

    // WHERE条件の配列
    const whereConditions = [eq(userWatches.userId, userId)]

    // フィルタリング条件を動的に追加
    if (filters.name) {
      whereConditions.push(ilike(dataSources.name, `%${filters.name}%`))
    }

    if (filters.owner) {
      // GitHubのfullNameから所有者を抽出（例: "facebook/react" -> "facebook"）
      whereConditions.push(
        ilike(
          sql`split_part(${repositories.fullName}, '/', 1)`,
          `%${filters.owner}%`,
        ),
      )
    }

    if (filters.search) {
      // 複数フィールドでの横断検索
      const searchCondition = or(
        ilike(dataSources.name, `%${filters.search}%`),
        ilike(dataSources.description, `%${filters.search}%`),
        ilike(dataSources.url, `%${filters.search}%`),
        ilike(repositories.fullName, `%${filters.search}%`),
      )
      if (searchCondition) {
        whereConditions.push(searchCondition)
      }
    }

    if (filters.sourceType) {
      whereConditions.push(eq(dataSources.sourceType, filters.sourceType))
    }

    if (filters.isPrivate !== undefined) {
      whereConditions.push(eq(dataSources.isPrivate, filters.isPrivate))
    }

    if (filters.language) {
      whereConditions.push(eq(repositories.language, filters.language))
    }

    if (filters.createdAfter) {
      whereConditions.push(gte(dataSources.createdAt, filters.createdAfter))
    }

    if (filters.createdBefore) {
      whereConditions.push(lte(dataSources.createdAt, filters.createdBefore))
    }

    if (filters.updatedAfter) {
      whereConditions.push(gte(dataSources.updatedAt, filters.updatedAfter))
    }

    if (filters.updatedBefore) {
      whereConditions.push(lte(dataSources.updatedAt, filters.updatedBefore))
    }

    // WHERE条件を適用
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions))
    }

    // ソート条件を適用
    const sortBy = filters.sortBy || "createdAt"
    const sortOrder = filters.sortOrder || "desc"
    const sortFunc = sortOrder === "asc" ? asc : desc

    switch (sortBy) {
      case "name":
        query = query.orderBy(sortFunc(dataSources.name))
        break
      case "createdAt":
        query = query.orderBy(sortFunc(dataSources.createdAt))
        break
      case "updatedAt":
        query = query.orderBy(sortFunc(dataSources.updatedAt))
        break
      case "addedAt":
        query = query.orderBy(sortFunc(userWatches.addedAt))
        break
      case "starsCount":
        query = query.orderBy(sortFunc(repositories.starsCount))
        break
      default:
        query = query.orderBy(sortFunc(dataSources.createdAt))
    }

    // 総件数を取得（ページネーション用）
    const countQuery = connection
      .select({ count: sql<number>`count(*)` })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const [results, [{ count: totalCount }]] = await Promise.all([
      query.limit(filters.limit || 20).offset(filters.offset || 0),
      countQuery,
    ])

    const total = Number(totalCount)

    // 結果を変換
    const items = results.map((row) => ({
      dataSource: {
        id: row.dataSourceId,
        sourceType: row.dataSourceType,
        sourceId: row.dataSourceSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
        isPrivate: row.dataSourceIsPrivate,
        createdAt: row.dataSourceCreatedAt,
        updatedAt: row.dataSourceUpdatedAt,
      },
      repository: {
        id: row.repositoryId,
        dataSourceId: row.repositoryDataSourceId,
        githubId: row.repositoryGithubId,
        fullName: row.repositoryFullName,
        owner: row.repositoryFullName.split("/")[0], // ownerフィールドを追加
        language: row.repositoryLanguage,
        starsCount: row.repositoryStarsCount,
        forksCount: row.repositoryForksCount,
        openIssuesCount: row.repositoryOpenIssuesCount,
        isFork: row.repositoryIsFork,
        createdAt: row.repositoryCreatedAt,
        updatedAt: row.repositoryUpdatedAt,
      },
      userWatch: {
        id: row.userWatchId,
        userId: row.userWatchUserId,
        dataSourceId: row.userWatchDataSourceId,
        notificationEnabled: row.userWatchNotificationEnabled,
        watchReleases: row.userWatchWatchReleases,
        watchIssues: row.userWatchWatchIssues,
        watchPullRequests: row.userWatchWatchPullRequests,
        addedAt: row.userWatchAddedAt,
      },
    }))

    return {
      items,
      total,
    }
  }

  /**
   * ユーザーのウォッチ関連付けと関連データを削除
   */
  async removeUserWatchAndRelatedData(
    dataSourceId: string,
    userId: string,
  ): Promise<boolean> {
    const connection = TransactionManager.getConnection()

    // まず権限チェック - ユーザーがこのデータソースをウォッチしているか確認
    const accessCheck = await connection
      .select({ id: userWatches.id })
      .from(userWatches)
      .where(
        and(
          eq(userWatches.dataSourceId, dataSourceId),
          eq(userWatches.userId, userId),
        ),
      )

    if (accessCheck.length === 0) {
      return false // アクセス権限なし
    }

    // トランザクション内で関連データを削除
    // 1. ユーザーに関連する通知を削除
    await connection.delete(notifications).where(
      and(
        eq(notifications.userId, userId),
        inArray(
          notifications.eventId,
          sql`(
            SELECT ${events.id} 
            FROM ${events} 
            WHERE ${events.dataSourceId} = ${dataSourceId}
          )`,
        ),
      ),
    )

    // 2. 対象データソースのイベントを削除
    await connection.delete(events).where(
      eq(events.dataSourceId, dataSourceId),
    )

    // 3. ユーザーのウォッチレコードを削除
    const deleteResult = await connection
      .delete(userWatches)
      .where(
        and(
          eq(userWatches.dataSourceId, dataSourceId),
          eq(userWatches.userId, userId),
        ),
      )

    return (deleteResult.rowCount ?? 0) > 0
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
