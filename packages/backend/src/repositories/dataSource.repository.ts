import { DrizzleBaseRepository, eq, and, db, QueryOptions } from "./base.js"
import { dataSources } from "../db/schema.js"
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"

export type DataSource = InferSelectModel<typeof dataSources>
export type NewDataSource = InferInsertModel<typeof dataSources>

export class DataSourceRepository extends DrizzleBaseRepository<DataSource> {
  constructor() {
    super(dataSources)
  }

  async create(
    data: Omit<DataSource, "id" | "createdAt" | "updatedAt">,
  ): Promise<DataSource> {
    const newDataSource = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [dataSource] = await db
      .insert(dataSources)
      .values(newDataSource)
      .returning()
    return dataSource
  }

  async findById(id: string): Promise<DataSource | null> {
    const [dataSource] = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, id))
      .limit(1)
    return dataSource || null
  }

  async findBySourceId(
    sourceType: string,
    sourceId: string,
  ): Promise<DataSource | null> {
    const [dataSource] = await db
      .select()
      .from(dataSources)
      .where(
        and(
          eq(dataSources.sourceType, sourceType),
          eq(dataSources.sourceId, sourceId),
        ),
      )
      .limit(1)
    return dataSource || null
  }

  async findByType(sourceType: string): Promise<DataSource[]> {
    return await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.sourceType, sourceType))
  }

  async findMany(
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<DataSource[]> {
    // Context7のDrizzle ORM推奨パターン: .$dynamic()を使用
    let query = db.select().from(dataSources).$dynamic()

    // 複数フィルタの適用
    const whereConditions = []
    if (filters?.sourceType) {
      whereConditions.push(
        eq(dataSources.sourceType, filters.sourceType as string),
      )
    }
    if (filters?.isPrivate !== undefined) {
      whereConditions.push(
        eq(dataSources.isPrivate, filters.isPrivate as boolean),
      )
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions))
    }

    // オプションの適用
    if (options?.orderBy === "createdAt") {
      query = query.orderBy(dataSources.createdAt)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    return await query
  }

  async update(
    id: string,
    data: Partial<DataSource>,
  ): Promise<DataSource | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const [dataSource] = await db
      .update(dataSources)
      .set(updateData)
      .where(eq(dataSources.id, id))
      .returning()

    return dataSource || null
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(dataSources).where(eq(dataSources.id, id))
    return result.rowCount !== null && result.rowCount > 0
  }

  async findOrCreateGitHubRepo(repoData: {
    sourceId: string // owner/repo format
    name: string
    description: string
    url: string
    isPrivate: boolean
  }): Promise<DataSource> {
    const existing = await this.findBySourceId(
      "github_repository",
      repoData.sourceId,
    )

    if (existing) {
      // Update repository data in case it changed
      return (await this.update(existing.id, {
        name: repoData.name,
        description: repoData.description,
        url: repoData.url,
        isPrivate: repoData.isPrivate,
      })) as DataSource
    }

    return await this.create({
      sourceType: "github_repository",
      ...repoData,
    })
  }
}
