import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import {
  activities,
  dataSources,
  repositories,
  userWatches,
} from "../../../../db/schema"
import type {
  ActivitiesListFilters,
  ActivitiesListQuery,
  ActivityDetail,
  ActivityDetailQuery,
  ActivityListItem,
  ActivityListResult,
  ActivitySortField,
  ActivitySortOrder,
  ActivitySourceSummary,
  ActivityStatus,
  ActivityType,
  DataSourceActivitiesListQuery,
  DataSourceActivitiesListResult,
} from "../../domain"
import { ACTIVITY_SORT_FIELDS, ACTIVITY_SORT_ORDER } from "../../domain"
import type { ActivityQueryRepository } from "../../domain/repositories/activity-query.repository"
import type { ActivityBodyTranslationStatus } from "shared/constants"
import z from "zod"

const SUMMARY_MAX_LENGTH = 280

type BaseActivityRow = {
  activityId: string
  dataSourceId: string
  activityType: ActivityType
  title: string
  translatedTitle: string | null
  body: string
  summary: string | null
  translatedBody: string | null
  bodyTranslationStatus: ActivityBodyTranslationStatus
  status: ActivityStatus
  statusDetail: string | null
  version: string | null
  createdAt: Date
  updatedAt: Date
  dataSourceType: string
  dataSourceName: string
  dataSourceUrl: string
  repositoryFullName: string | null
  repositoryLanguage: string | null
  repositoryStarsCount: number | null
  repositoryForksCount: number | null
  repositoryOpenIssuesCount: number | null
}

type ActivityListSelectRow = BaseActivityRow

type ActivityDetailSelectRow = BaseActivityRow

type SourceSummaryRow = Pick<
  BaseActivityRow,
  | "dataSourceId"
  | "dataSourceType"
  | "dataSourceName"
  | "dataSourceUrl"
  | "repositoryFullName"
  | "repositoryLanguage"
  | "repositoryStarsCount"
  | "repositoryForksCount"
  | "repositoryOpenIssuesCount"
>

export class DrizzleActivityQueryRepository implements ActivityQueryRepository {
  async listUserActivities(
    query: ActivitiesListQuery,
  ): Promise<ActivityListResult> {
    const connection = await TransactionManager.getConnection()

    const whereClause = this.buildWhereClause(query.userId, query.filters)
    const orderBy = this.resolveOrder(query.sort, query.order)
    const offset = (query.page - 1) * query.perPage

    const [rows, total] = await this.executeListQuery(connection, {
      where: whereClause,
      orderBy,
      perPage: query.perPage,
      offset,
    })

    return {
      items: rows.map((row) => this.mapToListItem(row)),
      pagination: this.buildPaginationMeta(query.page, query.perPage, total),
    }
  }

  async listDataSourceActivities(
    query: DataSourceActivitiesListQuery,
  ): Promise<DataSourceActivitiesListResult | null> {
    const connection = await TransactionManager.getConnection()

    const watch = await connection
      .select({ id: userWatches.id })
      .from(userWatches)
      .where(
        and(
          eq(userWatches.userId, query.userId),
          eq(userWatches.dataSourceId, query.dataSourceId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0])

    if (!watch) {
      return null
    }

    const dataSource = await connection
      .select({
        dataSourceId: dataSources.id,
        dataSourceType: dataSources.sourceType,
        dataSourceName: dataSources.name,
        dataSourceUrl: dataSources.url,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
      })
      .from(dataSources)
      .leftJoin(repositories, eq(repositories.dataSourceId, dataSources.id))
      .where(eq(dataSources.id, query.dataSourceId))
      .limit(1)
      .then((rows) => rows[0] as SourceSummaryRow | undefined)

    if (!dataSource) {
      return null
    }

    const whereClause = this.buildWhereClause(query.userId, query.filters, {
      dataSourceId: query.dataSourceId,
    })
    const orderBy = this.resolveOrder(query.sort, query.order)
    const offset = (query.page - 1) * query.perPage

    const [rows, total] = await this.executeListQuery(connection, {
      where: whereClause,
      orderBy,
      perPage: query.perPage,
      offset,
    })

    return {
      dataSource: this.mapToSourceSummary(dataSource),
      items: rows.map((row) => this.mapToListItem(row)),
      pagination: this.buildPaginationMeta(query.page, query.perPage, total),
    }
  }

  async getActivityDetail(
    query: ActivityDetailQuery,
  ): Promise<ActivityDetail | null> {
    const connection = await TransactionManager.getConnection()

    // ユーザー入力が不正なUUIDの場合PostgreSQL側でエラーになるため、事前に弾く
    if (!z.uuidv7().safeParse(query.activityId).success) {
      return null
    }

    const row = await connection
      .select(this.selectBaseFields())
      .from(activities)
      .innerJoin(dataSources, eq(dataSources.id, activities.dataSourceId))
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .leftJoin(repositories, eq(repositories.dataSourceId, dataSources.id))
      .where(
        and(
          eq(userWatches.userId, query.userId),
          eq(activities.id, query.activityId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] as ActivityDetailSelectRow | undefined)

    if (!row) {
      return null
    }

    return {
      activity: {
        id: row.activityId,
        activityType: row.activityType,
        title: row.title,
        translatedTitle: row.translatedTitle,
        summary: this.resolveSummary(row.summary, row.body),
        detail: row.body,
        translatedBody: row.translatedBody,
        bodyTranslationStatus: row.bodyTranslationStatus,
        status: row.status,
        statusDetail: row.statusDetail,
        version: row.version,
        occurredAt: row.createdAt,
        lastUpdatedAt: row.updatedAt,
        source: this.mapToSourceSummary(row),
      },
    }
  }

  private selectBaseFields() {
    return {
      activityId: activities.id,
      dataSourceId: activities.dataSourceId,
      activityType: activities.activityType,
      title: activities.title,
      translatedTitle: activities.translatedTitle,
      body: activities.body,
      summary: activities.summary,
      translatedBody: activities.translatedBody,
      bodyTranslationStatus: activities.bodyTranslationStatus,
      status: activities.status,
      statusDetail: activities.statusDetail,
      version: activities.version,
      createdAt: activities.createdAt,
      updatedAt: activities.updatedAt,
      dataSourceType: dataSources.sourceType,
      dataSourceName: dataSources.name,
      dataSourceUrl: dataSources.url,
      repositoryFullName: repositories.fullName,
      repositoryLanguage: repositories.language,
      repositoryStarsCount: repositories.starsCount,
      repositoryForksCount: repositories.forksCount,
      repositoryOpenIssuesCount: repositories.openIssuesCount,
    }
  }

  private async executeListQuery(
    connection: Awaited<ReturnType<typeof TransactionManager.getConnection>>,
    options: {
      where: SQL | undefined
      orderBy: SQL | SQL[]
      perPage: number
      offset: number
    },
  ): Promise<[ActivityListSelectRow[], number]> {
    const orderExpressions = Array.isArray(options.orderBy)
      ? options.orderBy
      : [options.orderBy]

    const rowsPromise = connection
      .select(this.selectBaseFields())
      .from(activities)
      .innerJoin(dataSources, eq(dataSources.id, activities.dataSourceId))
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .leftJoin(repositories, eq(repositories.dataSourceId, dataSources.id))
      .where(options.where)
      .orderBy(...orderExpressions)
      .limit(options.perPage)
      .offset(options.offset)

    const countPromise = connection
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .where(options.where)

    const [rows, [{ count }]] = await Promise.all([rowsPromise, countPromise])

    return [rows as ActivityListSelectRow[], Number(count)]
  }

  private buildWhereClause(
    userId: string,
    filters: ActivitiesListFilters | undefined,
    options: { dataSourceId?: string } = {},
  ): SQL | undefined {
    const normalizedFilters = filters ?? {}
    const conditions: SQL[] = [eq(userWatches.userId, userId)]

    if (options.dataSourceId) {
      conditions.push(eq(userWatches.dataSourceId, options.dataSourceId))
      conditions.push(eq(activities.dataSourceId, options.dataSourceId))
    }

    if (normalizedFilters.activityType) {
      conditions.push(
        eq(activities.activityType, normalizedFilters.activityType),
      )
    }

    if (normalizedFilters.status) {
      conditions.push(eq(activities.status, normalizedFilters.status))
    }

    if (normalizedFilters.since) {
      conditions.push(gte(activities.createdAt, normalizedFilters.since))
    }

    if (normalizedFilters.until) {
      conditions.push(lte(activities.createdAt, normalizedFilters.until))
    }

    if (conditions.length === 0) {
      return undefined
    }

    return conditions.length === 1 ? conditions[0] : and(...conditions)
  }

  private resolveOrder(sort: ActivitySortField, order: ActivitySortOrder) {
    const direction = order === ACTIVITY_SORT_ORDER.ASC ? asc : desc

    if (sort === ACTIVITY_SORT_FIELDS.UPDATED_AT) {
      return direction(activities.updatedAt)
    }

    return direction(activities.createdAt)
  }

  private mapToListItem(row: ActivityListSelectRow): ActivityListItem {
    return {
      activity: {
        id: row.activityId,
        activityType: row.activityType,
        title: row.title,
        translatedTitle: row.translatedTitle,
        summary: this.resolveSummary(row.summary, row.body),
        detail: null,
        translatedBody: row.translatedBody,
        bodyTranslationStatus: row.bodyTranslationStatus,
        status: row.status,
        statusDetail: row.statusDetail,
        version: row.version,
        occurredAt: row.createdAt,
        lastUpdatedAt: row.updatedAt,
        source: this.mapToSourceSummary(row),
      },
    }
  }

  private mapToSourceSummary(row: SourceSummaryRow): ActivitySourceSummary {
    const metadata = row.repositoryFullName
      ? {
          repositoryFullName: row.repositoryFullName,
          repositoryLanguage: row.repositoryLanguage,
          starsCount: row.repositoryStarsCount ?? undefined,
          forksCount: row.repositoryForksCount ?? undefined,
          openIssuesCount: row.repositoryOpenIssuesCount ?? undefined,
        }
      : undefined

    return {
      id: row.dataSourceId,
      sourceType: row.dataSourceType,
      name: row.dataSourceName,
      url: row.dataSourceUrl,
      metadata,
    }
  }

  private resolveSummary(
    summary: string | null,
    body: string | null,
  ): string | null {
    if (summary && summary.trim().length > 0) {
      return summary
    }

    if (!body) {
      return null
    }

    if (body.length <= SUMMARY_MAX_LENGTH) {
      return body
    }

    return `${body.slice(0, SUMMARY_MAX_LENGTH)}...`
  }

  private buildPaginationMeta(page: number, perPage: number, total: number) {
    const totalPages = total === 0 ? 0 : Math.ceil(total / perPage)

    return {
      page,
      perPage,
      total,
      totalPages,
      hasNext: totalPages > 0 && page < totalPages,
      hasPrev: totalPages > 0 && page > 1,
    }
  }
}
