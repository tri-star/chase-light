import type { UserAccount } from "../user-account"

export interface UserAccountRepository {
  findByAuth0Id(auth0UserId: string): Promise<UserAccount | null>
}
