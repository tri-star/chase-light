import { eq, like } from "drizzle-orm"
import { db } from "../../../db/connection"
import { users } from "../../../db/schema"
import { User } from "../schemas/user.schema"

type QueryOptions = {
  queries: {
    githubUserName?: string
    email?: string
  }
  orderBy?: "createdAt"
  limit?: number
  pageSize?: number
  page?: number
}

export class UserRepository {
  async save(data: User): Promise<void> {
    // TODO: data.idが存在するか確認
    //       存在する場合は data.updatedAtを更新し、update メソッドを呼び出す。
    await db.insert(users).values(data)
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

  async findMany(options?: QueryOptions): Promise<User[]> {
    let query = db.select().from(users).$dynamic()

    if (options?.queries.githubUserName) {
      query = query.where(
        like(users.githubUsername, `%${options.queries.githubUserName}%`),
      )
    }

    if (options?.orderBy === "createdAt") {
      query = query.orderBy(users.createdAt)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const pageSize = options?.pageSize || 10
    const page = options?.page || 1
    query = query.limit(pageSize).offset((page - 1) * pageSize)

    return await query
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData: Partial<User> = {
      name: data.name,
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
}
