import { Activity, ActivityStatus, ActivityType } from "../activity"

export interface ActivityRepository {
  /**
   * 新規アクティビティの作成またはUpsert
   * GitHub event IDによる重複チェックを行い、既存の場合は更新する
   */
  upsert(data: {
    id?: string
    dataSourceId: string
    githubEventId: string
    activityType: ActivityType
    title: string
    body: string
    version?: string | null
    status?: ActivityStatus
    statusDetail?: string | null
    githubData?: string | null
    createdAt: Date
  }): Promise<{ id: string; isNew: boolean }>

  /**
   * 複数イベントの一括Upsert
   */
  upsertMany(
    dataList: Array<{
      id?: string
      dataSourceId: string
      githubEventId: string
      activityType: ActivityType
      title: string
      body: string
      version?: string | null
      status?: ActivityStatus
      statusDetail?: string | null
      githubData?: string | null
      createdAt: Date
    }>,
  ): Promise<{ newActivityIds: string[]; updatedCount: number }>

  /**
   * 指定されたデータソースの最新イベントのcreatedAtを取得
   * 初回実行時はnullを返す
   */
  getLastCheckTimeForDataSource(dataSourceId: string): Promise<Date | null>

  /**
   * IDリストによる複数イベントの取得
   */
  findByIds(eventIds: string[]): Promise<Activity[]>

  /**
   * イベントのステータスを更新
   */
  updateStatus(
    eventId: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean>

  /**
   * 翻訳結果とステータスを更新
   */
  updateWithTranslation(
    eventId: string,
    translatedTitle: string,
    translatedBody: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean>

  /**
   * 複数イベントのステータスを一括更新
   */
  updateStatusBatch(
    eventIds: string[],
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<number>

  /**
   * IDでイベントを取得
   */
  findById(id: string): Promise<Activity | null>

  /**
   * データソースIDとステータスでイベントを取得
   */
  findByDataSourceAndStatus(
    dataSourceId: string,
    status: ActivityStatus,
    limit: number,
  ): Promise<Activity[]>

  /**
   * 指定期間内のイベント数を取得（統計用）
   */
  countByDataSourceAndDateRange(
    dataSourceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>
}
