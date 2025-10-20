/**
 * User Digest Execution Log entity
 * ユーザー単位でワーカーの実行履歴を管理するエンティティ
 */

import type { Brand } from "../../../core/utils/types"

export type UserDigestExecutionLogId = Brand<string, "UserDigestExecutionLogId">
export type UserId = Brand<string, "UserId">
export type WorkerName = Brand<string, "WorkerName">

/**
 * UserDigestExecutionLogIdへの変換関数
 */
export function toUserDigestExecutionLogId(
  id: string,
): UserDigestExecutionLogId {
  return id as UserDigestExecutionLogId
}

/**
 * UserIdへの変換関数
 */
export function toUserId(id: string): UserId {
  return id as UserId
}

/**
 * WorkerNameへの変換関数
 */
export function toWorkerName(name: string): WorkerName {
  return name as WorkerName
}

/**
 * User Digest Execution Log エンティティ
 */
export interface UserDigestExecutionLog {
  id: UserDigestExecutionLogId
  userId: UserId
  workerName: WorkerName
  lastSuccessfulRunAt: Date
  createdAt: Date
  updatedAt: Date
}
