import type { Activity, ActivityBodyTranslationStatus } from "../activity"

export type TranslationStateUpdate = {
  status?: ActivityBodyTranslationStatus
  requestedAt?: Date | null
  startedAt?: Date | null
  completedAt?: Date | null
  error?: string | null
  translatedBody?: string | null
  translatedTitle?: string | null
  summary?: string | null
}

export interface ActivityRepository {
  /**
   * ユーザーがウォッチしているアクティビティか検証しつつ取得
   */
  findByIdWithWatch(
    activityId: string,
    userId: string,
  ): Promise<Activity | null>

  /**
   * アクティビティIDで単体取得
   */
  findById(activityId: string): Promise<Activity | null>

  /**
   * 本文翻訳がpendingのアクティビティを取得（ワーカー用）
   * 依頼順（requestedAt昇順）、未設定はcreatedAt昇順で取得
   */
  findPendingBodyTranslations(limit: number): Promise<Activity[]>

  /**
   * 本文翻訳状態を更新する。
   * allowedCurrentStatuses が指定された場合、そのステータスに一致する場合のみ更新する。
   */
  updateBodyTranslationState(
    activityId: string,
    update: TranslationStateUpdate,
    allowedCurrentStatuses?: ActivityBodyTranslationStatus[],
  ): Promise<boolean>
}
