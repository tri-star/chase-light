import {
  eq,
  and,
  ilike,
  or,
  gte,
  lte,
  sql,
  asc,
  desc,
  inArray,
} from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../core/db"
import {
  dataSources,
  repositories,
  userWatches,
  activities,
  notifications,
} from "../../../db/schema"
import type {
  DataSource,
  DataSourceCreationInput,
  DataSourceUpdateInput,
  DataSourceListFilters,
  DataSourceListResult,
  DataSourceListItem,
  GitHubDataSource,
} from "../domain"

/**
 * データソースのリポジトリクラス
 * 既存のUserRepositoryパターンに従った実装
 */
export class DataSourceRepository {
  /**
   * データソースを保存（作成・更新）
   * GitHubDataSourceの場合はRepositoryも同時に作成・更新
   */
  async save(data: DataSourceCreationInput): Promise<DataSource> {
    return await TransactionManager.transaction(async () => {
      const now = new Date()
      const dataSourceId = randomUUID()
      const repositoryId = randomUUID()
      const connection = await TransactionManager.getConnection()

      if (data.sourceType === "github") {
        // 1. data_sourcesテーブルに保存
        const [dataSourceResult] = await connection
          .insert(dataSources)
          .values({
            id: dataSourceId,
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

        // 2. repositoriesテーブルに保存
        const [repositoryResult] = await connection
          .insert(repositories)
          .values({
            id: repositoryId,
            dataSourceId: dataSourceResult.id,
            githubId: data.repository.githubId,
            fullName: data.repository.fullName,
            language: data.repository.language,
            starsCount: data.repository.starsCount,
            forksCount: data.repository.forksCount,
            openIssuesCount: data.repository.openIssuesCount,
            isFork: data.repository.isFork,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [repositories.githubId],
            set: {
              dataSourceId: dataSourceResult.id,
              fullName: data.repository.fullName,
              language: data.repository.language,
              starsCount: data.repository.starsCount,
              forksCount: data.repository.forksCount,
              openIssuesCount: data.repository.openIssuesCount,
              isFork: data.repository.isFork,
              updatedAt: now,
            },
          })
          .returning()

        // 3. GitHubDataSource型として返す
        return {
          id: dataSourceResult.id,
          sourceType: "github" as const,
          sourceId: dataSourceResult.sourceId,
          name: dataSourceResult.name,
          description: dataSourceResult.description,
          url: dataSourceResult.url,
          isPrivate: dataSourceResult.isPrivate,
          createdAt: dataSourceResult.createdAt,
          updatedAt: dataSourceResult.updatedAt,
          repository: {
            id: repositoryResult.id,
            githubId: repositoryResult.githubId,
            fullName: repositoryResult.fullName,
            owner: repositoryResult.fullName.split("/")[0] || "",
            language: repositoryResult.language,
            starsCount: repositoryResult.starsCount,
            forksCount: repositoryResult.forksCount,
            openIssuesCount: repositoryResult.openIssuesCount,
            isFork: repositoryResult.isFork,
            createdAt: repositoryResult.createdAt!,
            updatedAt: repositoryResult.updatedAt!,
          },
        } as GitHubDataSource
      }

      throw new Error(`Unsupported sourceType: ${data.sourceType}`)
    })
  }

  /**
   * IDでデータソースを検索（repository情報を内包）
   */
  async findById(id: string): Promise<DataSource | null> {
    const connection = await TransactionManager.getConnection()
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
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .where(eq(dataSources.id, id))

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    if (row.dataSourceType === "github") {
      return {
        id: row.dataSourceId,
        sourceType: "github" as const,
        sourceId: row.dataSourceSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
        isPrivate: row.dataSourceIsPrivate,
        createdAt: row.dataSourceCreatedAt,
        updatedAt: row.dataSourceUpdatedAt,
        repository: {
          id: row.repositoryId,
          githubId: row.repositoryGithubId,
          fullName: row.repositoryFullName,
          owner: row.repositoryFullName.split("/")[0] || "",
          language: row.repositoryLanguage,
          starsCount: row.repositoryStarsCount,
          forksCount: row.repositoryForksCount,
          openIssuesCount: row.repositoryOpenIssuesCount,
          isFork: row.repositoryIsFork,
          createdAt: row.repositoryCreatedAt!,
          updatedAt: row.repositoryUpdatedAt!,
        },
      } as GitHubDataSource
    }

    throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
  }

  /**
   * ソースタイプとソースIDでデータソースを検索（repository情報を内包）
   */
  async findBySourceTypeAndId(
    sourceType: string,
    sourceId: string,
  ): Promise<DataSource | null> {
    const connection = await TransactionManager.getConnection()
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
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .where(
        and(
          eq(dataSources.sourceType, sourceType),
          eq(dataSources.sourceId, sourceId),
        ),
      )

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    if (row.dataSourceType === "github") {
      return {
        id: row.dataSourceId,
        sourceType: "github" as const,
        sourceId: row.dataSourceSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
        isPrivate: row.dataSourceIsPrivate,
        createdAt: row.dataSourceCreatedAt,
        updatedAt: row.dataSourceUpdatedAt,
        repository: {
          id: row.repositoryId,
          githubId: row.repositoryGithubId,
          fullName: row.repositoryFullName,
          owner: row.repositoryFullName.split("/")[0] || "",
          language: row.repositoryLanguage,
          starsCount: row.repositoryStarsCount,
          forksCount: row.repositoryForksCount,
          openIssuesCount: row.repositoryOpenIssuesCount,
          isFork: row.repositoryIsFork,
          createdAt: row.repositoryCreatedAt!,
          updatedAt: row.repositoryUpdatedAt!,
        },
      } as GitHubDataSource
    }

    throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
  }

  /**
   * 複数のデータソースを検索（repository情報を内包）
   */
  async findMany(filters?: { sourceType?: string }): Promise<DataSource[]> {
    const connection = await TransactionManager.getConnection()
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
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .$dynamic()

    if (filters?.sourceType) {
      query = query.where(eq(dataSources.sourceType, filters.sourceType))
    }

    const results = await query
    return results.map((row) => {
      if (row.dataSourceType === "github") {
        return {
          id: row.dataSourceId,
          sourceType: "github" as const,
          sourceId: row.dataSourceSourceId,
          name: row.dataSourceName,
          description: row.dataSourceDescription,
          url: row.dataSourceUrl,
          isPrivate: row.dataSourceIsPrivate,
          createdAt: row.dataSourceCreatedAt,
          updatedAt: row.dataSourceUpdatedAt,
          repository: {
            id: row.repositoryId,
            githubId: row.repositoryGithubId,
            fullName: row.repositoryFullName,
            owner: row.repositoryFullName.split("/")[0] || "",
            language: row.repositoryLanguage,
            starsCount: row.repositoryStarsCount,
            forksCount: row.repositoryForksCount,
            openIssuesCount: row.repositoryOpenIssuesCount,
            isFork: row.repositoryIsFork,
            createdAt: row.repositoryCreatedAt!,
            updatedAt: row.repositoryUpdatedAt!,
          },
        } as GitHubDataSource
      }
      throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
    })
  }

  /**
   * データソースを削除
   */
  async delete(id: string): Promise<boolean> {
    const connection = await TransactionManager.getConnection()
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
    const connection = await TransactionManager.getConnection()
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

    if (!result) {
      return null
    }

    // 更新後のデータを取得してGitHubDataSource型で返す
    return await this.findById(result.id)
  }

  /**
   * ユーザーのアクセス権限を持つデータソースを詳細情報付きで取得
   */
  async findByIdWithUserAccess(
    id: string,
    userId: string,
  ): Promise<DataSourceListItem | null> {
    const connection = await TransactionManager.getConnection()
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
    if (row.dataSourceType === "github") {
      return {
        dataSource: {
          id: row.dataSourceId,
          sourceType: "github" as const,
          sourceId: row.dataSourceSourceId,
          name: row.dataSourceName,
          description: row.dataSourceDescription,
          url: row.dataSourceUrl,
          isPrivate: row.dataSourceIsPrivate,
          createdAt: row.dataSourceCreatedAt,
          updatedAt: row.dataSourceUpdatedAt,
          repository: {
            id: row.repositoryId,
            githubId: row.repositoryGithubId,
            fullName: row.repositoryFullName,
            owner: row.repositoryFullName.split("/")[0] || "",
            language: row.repositoryLanguage,
            starsCount: row.repositoryStarsCount,
            forksCount: row.repositoryForksCount,
            openIssuesCount: row.repositoryOpenIssuesCount,
            isFork: row.repositoryIsFork,
            createdAt: row.repositoryCreatedAt!,
            updatedAt: row.repositoryUpdatedAt!,
          },
        } as GitHubDataSource,
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
    throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
  }

  /**
   * フィルタリング条件付きでユーザーのデータソースを取得
   */
  async findByUserWithFilters(
    userId: string,
    filters: DataSourceListFilters = {},
  ): Promise<DataSourceListResult> {
    const connection = await TransactionManager.getConnection()
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
    const items = results.map((row: (typeof results)[number]) => {
      if (row.dataSourceType === "github") {
        return {
          dataSource: {
            id: row.dataSourceId,
            sourceType: "github" as const,
            sourceId: row.dataSourceSourceId,
            name: row.dataSourceName,
            description: row.dataSourceDescription,
            url: row.dataSourceUrl,
            isPrivate: row.dataSourceIsPrivate,
            createdAt: row.dataSourceCreatedAt,
            updatedAt: row.dataSourceUpdatedAt,
            repository: {
              id: row.repositoryId,
              githubId: row.repositoryGithubId,
              fullName: row.repositoryFullName,
              owner: row.repositoryFullName.split("/")[0] || "",
              language: row.repositoryLanguage,
              starsCount: row.repositoryStarsCount,
              forksCount: row.repositoryForksCount,
              openIssuesCount: row.repositoryOpenIssuesCount,
              isFork: row.repositoryIsFork,
              createdAt: row.repositoryCreatedAt!,
              updatedAt: row.repositoryUpdatedAt!,
            },
          } as GitHubDataSource,
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
      throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
    })

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
    const connection = await TransactionManager.getConnection()

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
          notifications.activityId,
          sql`(
            SELECT ${activities.id}
            FROM ${activities}
            WHERE ${activities.dataSourceId} = ${dataSourceId}
          )`,
        ),
      ),
    )

    // 2. 対象データソースのアクティビティを削除
    await connection
      .delete(activities)
      .where(eq(activities.dataSourceId, dataSourceId))

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
}
