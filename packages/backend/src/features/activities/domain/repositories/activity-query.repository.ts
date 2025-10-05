import type {
  ActivitiesListQuery,
  ActivityDetail,
  ActivityDetailQuery,
  ActivityListResult,
  DataSourceActivitiesListQuery,
  DataSourceActivitiesListResult,
} from "../activity"

export interface ActivityQueryRepository {
  listUserActivities(query: ActivitiesListQuery): Promise<ActivityListResult>
  listDataSourceActivities(
    query: DataSourceActivitiesListQuery,
  ): Promise<DataSourceActivitiesListResult | null>
  getActivityDetail(query: ActivityDetailQuery): Promise<ActivityDetail | null>
}
