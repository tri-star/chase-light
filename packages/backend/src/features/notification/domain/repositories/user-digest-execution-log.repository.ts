/**
 * User Digest Execution Log Repository Port
 * ユーザー単位実行履歴リポジトリのインターフェース定義
 */

import type {
  UserId,
  WorkerName,
  UserDigestExecutionLog,
} from "../user-digest-execution-log"

/**
 * ユーザー単位実行履歴リポジトリのポート
 */
export interface UserDigestExecutionLogRepository {
  /**
   * 指定されたユーザーとワーカーの最終成功実行時刻を取得
   * @param userId ユーザーID
   * @param workerName ワーカー名
   * @returns 最終成功実行時刻、存在しない場合はnull
   */
  getLastSuccessfulRunAt(
    userId: UserId,
    workerName: WorkerName,
  ): Promise<Date | null>

  /**
   * 指定されたユーザーとワーカーの最終成功実行時刻を更新
   * 存在しない場合は新規作成
   * @param userId ユーザーID
   * @param workerName ワーカー名
   * @param timestamp 最終成功実行時刻
   */
  updateLastSuccessfulRunAt(
    userId: UserId,
    workerName: WorkerName,
    timestamp: Date,
  ): Promise<void>

  /**
   * 指定されたユーザーとワーカーの実行ログを取得
   * @param userId ユーザーID
   * @param workerName ワーカー名
   * @returns 実行ログ、存在しない場合はnull
   */
  findByUserAndWorker(
    userId: UserId,
    workerName: WorkerName,
  ): Promise<UserDigestExecutionLog | null>
}
