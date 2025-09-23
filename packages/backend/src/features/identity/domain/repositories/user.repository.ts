import type { User } from "../user"

export type FindUsersQueryOptions = {
  queries?: {
    githubUserName?: string
    email?: string
  }
  orderBy?: "createdAt"
  limit?: number
  pageSize?: number
  page?: number
}

export interface UserRepository {
  save(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByAuth0Id(auth0UserId: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGithubUsername(githubUsername: string): Promise<User | null>
  findMany(options?: FindUsersQueryOptions): Promise<User[]>
  delete(id: string): Promise<boolean>
}
