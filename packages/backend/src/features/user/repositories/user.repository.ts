import { eq, like } from "drizzle-orm"
import { db } from "../../../db/connection"
import { users } from "../../../db/schema"
import { User } from "../domain/user"

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
    // 既存ユーザーかどうかを確認
    const existingUser = await this.findById(data.id)

    if (existingUser) {
      // 更新の場合：updatedAtを現在時刻に設定してUPDATE
      const updateData = {
        ...data,
        updatedAt: new Date(),
      }

      await db.update(users).set(updateData).where(eq(users.id, data.id))
    } else {
      // 新規作成の場合：INSERT
      await db.insert(users).values(data)
    }
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
      // explicit limitが指定された場合はpaginationなし
      query = query.limit(options.limit)
    } else {
      // limitがない場合のみpagination適用
      const pageSize = options?.pageSize || 10
      const page = options?.page || 1
      query = query.limit(pageSize).offset((page - 1) * pageSize)
    }

    return await query
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id))
    return result.rowCount !== null && result.rowCount > 0
  }
}
