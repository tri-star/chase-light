import { User } from "../user"

export type UserQueryOptions = {
  queries: {
    githubUserName?: string
    email?: string
  }
  orderBy?: "createdAt"
  limit?: number
  pageSize?: number
  page?: number
}

export type FindManyUsersInputDto = {
  options?: UserQueryOptions
}

export type FindManyUsersOutputDto = {
  users: User[]
}

export interface UserRepository {
  save(user: User): Promise<void>

  findById(id: string): Promise<User | null>

  findByAuth0Id(auth0UserId: string): Promise<User | null>

  findByEmail(email: string): Promise<User | null>

  findByGithubUsername(githubUsername: string): Promise<User | null>

  findMany(input: FindManyUsersInputDto): Promise<FindManyUsersOutputDto>

  delete(id: string): Promise<boolean>
}
