import {
  DrizzleBaseRepository,
  eq,
  db,
  QueryOptions,
} from "../../shared/repositories/base.js"
import { users } from "../../../db/schema.js"
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export class UserRepository extends DrizzleBaseRepository<User> {
  constructor() {
    super(users)
  }

  async create(
    data: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    const newUser = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [user] = await db.insert(users).values(newUser).returning()
    return user
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return user || null
  }

  async findByAuth0Id(auth0UserId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0UserId, auth0UserId))
      .limit(1)
    return user || null
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    return user || null
  }

  async findByGithubUsername(githubUsername: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.githubUsername, githubUsername))
      .limit(1)
    return user || null
  }

  async findMany(
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<User[]> {
    // Context7のDrizzle ORM推奨パターン: .$dynamic()を使用
    let query = db.select().from(users).$dynamic()

    // フィルタの適用
    if (filters?.timezone) {
      query = query.where(eq(users.timezone, filters.timezone as string))
    }

    // オプションの適用
    if (options?.orderBy === "createdAt") {
      query = query.orderBy(users.createdAt)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    return await query
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    return user || null
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id))
    return result.rowCount !== null && result.rowCount > 0
  }

  async findOrCreateByAuth0(auth0Data: {
    auth0UserId: string
    email: string
    name: string
    avatarUrl: string
    githubUsername?: string
    timezone: string
  }): Promise<User> {
    const existingUser = await this.findByAuth0Id(auth0Data.auth0UserId)

    if (existingUser) {
      // Update user data in case it changed
      return (await this.update(existingUser.id, {
        email: auth0Data.email,
        name: auth0Data.name,
        avatarUrl: auth0Data.avatarUrl,
        githubUsername: auth0Data.githubUsername || null,
        timezone: auth0Data.timezone,
      })) as User
    }

    return await this.create({
      ...auth0Data,
      githubUsername: auth0Data.githubUsername || null,
    })
  }
}
