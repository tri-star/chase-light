import { eq } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { users } from "../../../../db/schema"
import type { UserAccount } from "../../domain/user-account"
import type { UserAccountRepository } from "../../domain/repositories"

export class DrizzleUserAccountRepository implements UserAccountRepository {
  async findByAuth0Id(auth0UserId: string): Promise<UserAccount | null> {
    const connection = await TransactionManager.getConnection()
    const result = await connection
      .select({ id: users.id, auth0UserId: users.auth0UserId })
      .from(users)
      .where(eq(users.auth0UserId, auth0UserId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return {
      id: result[0].id,
      auth0UserId: result[0].auth0UserId,
    }
  }
}
