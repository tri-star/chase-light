import type {
  DataSource,
  DataSourceCreationInput,
  DataSourceListFilters,
  DataSourceListItem,
  DataSourceListResult,
  DataSourceType,
  DataSourceUpdateInput,
} from "../../domain"
import type { DataSourceRepository as DataSourceRepositoryPort } from "../../domain/repositories"
import { DataSourceRepository as LegacyDataSourceRepository } from "../../repositories/data-source.repository"

export class DrizzleDataSourceRepository implements DataSourceRepositoryPort {
  private readonly delegate = new LegacyDataSourceRepository()

  save(input: DataSourceCreationInput): Promise<DataSource> {
    return this.delegate.save(input)
  }

  findById(id: string): Promise<DataSource | null> {
    return this.delegate.findById(id)
  }

  findMany(filters?: { sourceType?: DataSourceType }): Promise<DataSource[]> {
    return this.delegate.findMany(filters)
  }

  findBySourceTypeAndId(
    sourceType: DataSourceType,
    sourceId: string,
  ): Promise<DataSource | null> {
    return this.delegate.findBySourceTypeAndId(sourceType, sourceId)
  }

  findByIdWithUserAccess(
    id: string,
    userId: string,
  ): Promise<DataSourceListItem | null> {
    return this.delegate.findByIdWithUserAccess(id, userId)
  }

  findByUserWithFilters(
    userId: string,
    filters?: DataSourceListFilters,
  ): Promise<DataSourceListResult> {
    return this.delegate.findByUserWithFilters(userId, filters)
  }

  updateByIdWithUserAccess(
    id: string,
    userId: string,
    updateData: DataSourceUpdateInput,
  ): Promise<DataSource | null> {
    return this.delegate.updateByIdWithUserAccess(id, userId, updateData)
  }

  delete(id: string): Promise<boolean> {
    return this.delegate.delete(id)
  }

  removeUserWatchAndRelatedData(
    dataSourceId: string,
    userId: string,
  ): Promise<boolean> {
    return this.delegate.removeUserWatchAndRelatedData(dataSourceId, userId)
  }
}
