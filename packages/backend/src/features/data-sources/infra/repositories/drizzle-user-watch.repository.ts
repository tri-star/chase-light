import type {
  UserWatch,
  UserWatchCreationInput,
  UserWatchUpdateInput,
} from "../../domain"
import type { UserWatchRepository as UserWatchRepositoryPort } from "../../domain/repositories"
import { UserWatchRepository as LegacyUserWatchRepository } from "../../repositories/user-watch.repository"

export class DrizzleUserWatchRepository implements UserWatchRepositoryPort {
  private readonly delegate = new LegacyUserWatchRepository()

  save(input: UserWatchCreationInput): Promise<UserWatch> {
    return this.delegate.save(input)
  }

  findById(id: string): Promise<UserWatch | null> {
    return this.delegate.findById(id)
  }

  findByUserId(userId: string): Promise<UserWatch[]> {
    return this.delegate.findByUserId(userId)
  }

  findByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<UserWatch | null> {
    return this.delegate.findByUserAndDataSource(userId, dataSourceId)
  }

  updateByUserAndDataSource(
    userId: string,
    dataSourceId: string,
    updateData: UserWatchUpdateInput,
  ): Promise<UserWatch | null> {
    return this.delegate.updateByUserAndDataSource(
      userId,
      dataSourceId,
      updateData,
    )
  }

  delete(id: string): Promise<boolean> {
    return this.delegate.delete(id)
  }

  deleteByUserAndDataSource(
    userId: string,
    dataSourceId: string,
  ): Promise<boolean> {
    return this.delegate.deleteByUserAndDataSource(userId, dataSourceId)
  }
}
