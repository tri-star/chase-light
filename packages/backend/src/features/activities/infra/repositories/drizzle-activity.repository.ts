/**
 * アクティビティリポジトリのDrizzle ORM実装
 *
 * アクティビティの参照（読み取り）操作を実装
 */

import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import {
  activities,
  dataSources,
  userWatches,
  users,
} from "../../../../db/schema"
import type {
  ActivityRepository,
  FindActivitiesInput,
  FindByDataSourceInput,
  ActivityFilterInput,
} from "../../domain/repositories/activity.repository"
import type {
  ActivityId,
  ActivityWithDataSource,
  ActivityDetail,
} from "../../domain/activity"
import { toActivityId } from "../../domain/activity"

/**
 * Drizzleを使用したアクティビティリポジトリ実装
 */
export class DrizzleActivityRepository implements ActivityRepository {
  /**
   * ユーザーに関連するアクティビティ一覧を取得
   */
  async findByUserId(
    input: FindActivitiesInput,
  ): Promise<ActivityWithDataSource[]> {
    const connection = await TransactionManager.getConnection()
    const { userId, filter, pagination, sort } = input

    // WHERE句の構築
    const whereConditions = this.buildWhereConditions(userId, filter)

    // ORDER BY句の構築
    const orderByClause =
      sort.sortBy === "createdAt"
        ? sort.sortOrder === "asc"
          ? asc(activities.createdAt)
          : desc(activities.createdAt)
        : sort.sortOrder === "asc"
          ? asc(activities.updatedAt)
          : desc(activities.updatedAt)

    // OFFSET計算
    const offset = (pagination.page - 1) * pagination.perPage

    // クエリ実行
    const results = await connection
      .select({
        id: activities.id,
        dataSourceId: activities.dataSourceId,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        version: activities.version,
        status: activities.status,
        statusDetail: activities.statusDetail,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        dataSourceName: dataSources.name,
        dataSourceUrl: dataSources.url,
      })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .innerJoin(users, eq(userWatches.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(pagination.perPage)
      .offset(offset)

    return results.map(this.mapToActivityWithDataSource)
  }

  /**
   * ユーザーに関連するアクティビティの総件数を取得
   */
  async countByUserId(
    userId: string,
    filter?: ActivityFilterInput,
  ): Promise<number> {
    const connection = await TransactionManager.getConnection()

    const whereConditions = this.buildWhereConditions(userId, filter)

    const result = await connection
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .innerJoin(users, eq(userWatches.userId, users.id))
      .where(and(...whereConditions))

    return result[0]?.count ?? 0
  }

  /**
   * アクティビティ詳細を取得（権限チェック付き）
   */
  async findById(
    activityId: ActivityId,
    userId: string,
  ): Promise<ActivityDetail | null> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select({
        id: activities.id,
        dataSourceId: activities.dataSourceId,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        version: activities.version,
        status: activities.status,
        statusDetail: activities.statusDetail,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        dataSourceName: dataSources.name,
        dataSourceDescription: dataSources.description,
        dataSourceUrl: dataSources.url,
      })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .innerJoin(users, eq(userWatches.userId, users.id))
      .where(and(eq(activities.id, activityId), eq(users.auth0UserId, userId)))

    if (results.length === 0) {
      return null
    }

    return this.mapToActivityDetail(results[0])
  }

  /**
   * データソース別アクティビティ一覧を取得（権限チェック付き）
   */
  async findByDataSourceId(
    input: FindByDataSourceInput,
  ): Promise<ActivityWithDataSource[]> {
    const connection = await TransactionManager.getConnection()
    const { userId, dataSourceId, filter, pagination, sort } = input

    // WHERE句の構築（dataSourceIdを追加）
    const whereConditions = this.buildWhereConditions(userId, filter, [
      eq(dataSources.id, dataSourceId),
    ])

    // ORDER BY句の構築
    const orderByClause =
      sort.sortBy === "createdAt"
        ? sort.sortOrder === "asc"
          ? asc(activities.createdAt)
          : desc(activities.createdAt)
        : sort.sortOrder === "asc"
          ? asc(activities.updatedAt)
          : desc(activities.updatedAt)

    // OFFSET計算
    const offset = (pagination.page - 1) * pagination.perPage

    // クエリ実行
    const results = await connection
      .select({
        id: activities.id,
        dataSourceId: activities.dataSourceId,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        version: activities.version,
        status: activities.status,
        statusDetail: activities.statusDetail,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        dataSourceName: dataSources.name,
        dataSourceUrl: dataSources.url,
      })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .innerJoin(users, eq(userWatches.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(pagination.perPage)
      .offset(offset)

    return results.map(this.mapToActivityWithDataSource)
  }

  /**
   * データソース別アクティビティの総件数を取得（権限チェック付き）
   */
  async countByDataSourceId(
    userId: string,
    dataSourceId: string,
    filter?: ActivityFilterInput,
  ): Promise<number> {
    const connection = await TransactionManager.getConnection()

    const whereConditions = this.buildWhereConditions(userId, filter, [
      eq(dataSources.id, dataSourceId),
    ])

    const result = await connection
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(userWatches, eq(dataSources.id, userWatches.dataSourceId))
      .innerJoin(users, eq(userWatches.userId, users.id))
      .where(and(...whereConditions))

    return result[0]?.count ?? 0
  }

  /**
   * WHERE句の条件を構築
   */
  private buildWhereConditions(
    userId: string,
    filter?: ActivityFilterInput,
    additionalConditions: ReturnType<typeof eq>[] = [],
  ): ReturnType<typeof eq>[] {
    const conditions: ReturnType<typeof eq>[] = [
      eq(users.auth0UserId, userId),
      ...additionalConditions,
    ]

    if (filter) {
      if (filter.activityType) {
        conditions.push(eq(activities.activityType, filter.activityType))
      }
      if (filter.status) {
        conditions.push(eq(activities.status, filter.status))
      }
      if (filter.createdAfter) {
        conditions.push(gte(activities.createdAt, filter.createdAfter))
      }
      if (filter.createdBefore) {
        conditions.push(lte(activities.createdAt, filter.createdBefore))
      }
      if (filter.updatedAfter) {
        conditions.push(gte(activities.updatedAt, filter.updatedAfter))
      }
      if (filter.updatedBefore) {
        conditions.push(lte(activities.updatedAt, filter.updatedBefore))
      }
    }

    return conditions
  }

  /**
   * データベース結果をActivityWithDataSource型に変換
   */
  private mapToActivityWithDataSource(row: {
    id: string
    dataSourceId: string
    activityType: string
    title: string
    body: string
    version: string | null
    status: string
    statusDetail: string | null
    createdAt: Date
    updatedAt: Date
    dataSourceName: string
    dataSourceUrl: string
  }): ActivityWithDataSource {
    return {
      id: toActivityId(row.id),
      dataSourceId: row.dataSourceId,
      activityType: row.activityType as ActivityWithDataSource["activityType"],
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status as ActivityWithDataSource["status"],
      statusDetail: row.statusDetail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dataSource: {
        id: row.dataSourceId,
        name: row.dataSourceName,
        url: row.dataSourceUrl,
      },
    }
  }

  /**
   * データベース結果をActivityDetail型に変換
   */
  private mapToActivityDetail(row: {
    id: string
    dataSourceId: string
    activityType: string
    title: string
    body: string
    version: string | null
    status: string
    statusDetail: string | null
    createdAt: Date
    updatedAt: Date
    dataSourceName: string
    dataSourceDescription: string
    dataSourceUrl: string
  }): ActivityDetail {
    return {
      id: toActivityId(row.id),
      dataSourceId: row.dataSourceId,
      activityType: row.activityType as ActivityDetail["activityType"],
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status as ActivityDetail["status"],
      statusDetail: row.statusDetail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dataSource: {
        id: row.dataSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
      },
    }
  }
}
