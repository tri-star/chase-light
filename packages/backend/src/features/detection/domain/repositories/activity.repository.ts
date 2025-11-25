import { Activity, ActivityStatus, ActivityType } from "../activity"
import { DetectTargetId } from "../detect-target"

export interface ActivityRepository {
  /**
   * 新規アクティビティの作成またはUpsert
   * GitHub event IDによる重複チェックを行い、既存の場合は更新する
   */
  upsert(data: {
    id?: string
    detectTargetId: DetectTargetId
    githubEventId: string
    activityType: ActivityType
    title: string
    body: string
    translatedTitle?: string | null
    summary?: string | null
    translatedBody?: string | null
    version?: string | null
    status?: ActivityStatus
    statusDetail?: string | null
    githubData?: string | null
    createdAt: Date
  }): Promise<{ id: string; isNew: boolean }>

  /**
   * 複数アクティビティの一括Upsert
   */
  upsertMany(
    dataList: Array<{
      id?: string
      detectTargetId: DetectTargetId
      githubEventId: string
      activityType: ActivityType
      title: string
      body: string
      translatedTitle?: string | null
      summary?: string | null
      translatedBody?: string | null
      version?: string | null
      status?: ActivityStatus
      statusDetail?: string | null
      githubData?: string | null
      createdAt: Date
    }>,
  ): Promise<{ newActivityIds: string[]; updatedCount: number }>

  /**
   * 指定されたデータソースの最新アクティビティのcreatedAtを取得
   * 初回実行時はnullを返す
   */
  getLastCheckTimeForDataSource(
    dataSourceId: DetectTargetId,
  ): Promise<Date | null>

  /**
   * IDリストによる複数アクティビティの取得
   */
  findByIds(activityIds: string[]): Promise<Activity[]>

  /**
   * アクティビティのステータスを更新
   */
  updateStatus(
    activityId: string,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean>

  /**
   * 翻訳結果とステータスを更新
   */
  updateWithTranslation(
    activityId: string,
    translatedTitle: string | null,
    summary: string | null,
    translatedBody: string | null,
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<boolean>

  /**
   * 複数アクティビティのステータスを一括更新
   */
  updateStatusBatch(
    activityIds: string[],
    status: ActivityStatus,
    statusDetail?: string | null,
  ): Promise<number>

  /**
   * IDでアクティビティを取得
   */
  findById(id: string): Promise<Activity | null>

  /**
   * データソースIDとステータスでアクティビティを取得
   */
  findByDataSourceAndStatus(
    detectTargetId: DetectTargetId,
    status: ActivityStatus,
    limit: number,
  ): Promise<Activity[]>

  /**
   * 指定期間内のアクティビティ数を取得（統計用）
   */
  countByDataSourceAndDateRange(
    detectTargetId: DetectTargetId,
    startDate: Date,
    endDate: Date,
  ): Promise<number>
}
