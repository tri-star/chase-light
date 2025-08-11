import { eq, like } from "drizzle-orm"
import { TransactionManager } from "../../../shared/db"
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
    // onConflictDoUpdateを使用してアトミックなupsert操作を実行し、競合状態を回避します。
    const { id: _id, createdAt: _createdAt, ...updateFields } = data
    await (await TransactionManager.getConnection())
      .insert(users)
      .values({ ...data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: users.auth0UserId,
        set: { ...updateFields, updatedAt: new Date() },
      })
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await (await TransactionManager.getConnection())
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return user || null
  }

  async findByAuth0Id(auth0UserId: string): Promise<User | null> {
    const [user] = await (await TransactionManager.getConnection())
      .select()
      .from(users)
      .where(eq(users.auth0UserId, auth0UserId))
      .limit(1)
    return user || null
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await (await TransactionManager.getConnection())
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    return user || null
  }

  async findByGithubUsername(githubUsername: string): Promise<User | null> {
    const [user] = await (await TransactionManager.getConnection())
      .select()
      .from(users)
      .where(eq(users.githubUsername, githubUsername))
      .limit(1)
    return user || null
  }

  async findMany(options?: QueryOptions): Promise<User[]> {
    let query = (await TransactionManager.getConnection())
      .select()
      .from(users)
      .$dynamic()

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
    const result = await (await TransactionManager.getConnection())
      .delete(users)
      .where(eq(users.id, id))
    return result.rowCount !== null && result.rowCount > 0
  }
}
