import type {
  UserWatch,
  UserWatchCreationInput,
  UserWatchUpdateInput,
} from "../user-watch"

export interface UserWatchRepository {
  save(input: UserWatchCreationInput): Promise<UserWatch>
  findById(id: string): Promise<UserWatch | null>
  findByUserId(userId: string): Promise<UserWatch[]>
  findByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<UserWatch | null>
  updateByUserAndDataSource(
    userId: string,
    dataSourceId: string,
    updateData: UserWatchUpdateInput,
  ): Promise<UserWatch | null>
  delete(id: string): Promise<boolean>
  deleteByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<boolean>
}
