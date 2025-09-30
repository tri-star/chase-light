import type {
  DataSource,
  DataSourceCreationInput,
  DataSourceType,
  DataSourceUpdateInput,
} from "../data-source"
import type {
  DataSourceListFilters,
  DataSourceListItem,
  DataSourceListResult,
} from "../data-source-list"

export interface DataSourceRepository {
  save(input: DataSourceCreationInput): Promise<DataSource>
  findById(id: string): Promise<DataSource | null>
  findMany(filters?: { sourceType?: DataSourceType }): Promise<DataSource[]>
  findBySourceTypeAndId(
    sourceType: DataSourceType,
    sourceId: string,
  ): Promise<DataSource | null>
  findByIdWithUserAccess(
    id: string,
    userId: string,
  ): Promise<DataSourceListItem | null>
  findByUserWithFilters(
    userId: string,
    filters?: DataSourceListFilters,
  ): Promise<DataSourceListResult>
  updateByIdWithUserAccess(
    id: string,
    userId: string,
    updateData: DataSourceUpdateInput,
  ): Promise<DataSource | null>
  delete(id: string): Promise<boolean>
  removeUserWatchAndRelatedData(
    dataSourceId: string,
    userId: string,
  ): Promise<boolean>
}
