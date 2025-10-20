/**
 * Drizzle User Digest Execution Log Repository
 * ユーザー単位実行履歴リポジトリの実装
 */

import { eq, and } from "drizzle-orm"
import { userDigestExecutionLogs } from "../../../../db/schema"
import type {
  UserId,
  WorkerName,
  UserDigestExecutionLog,
} from "../../domain/user-digest-execution-log"
import {
  toUserDigestExecutionLogId,
  toUserId,
  toWorkerName,
} from "../../domain/user-digest-execution-log"
import type { UserDigestExecutionLogRepository } from "../../domain/repositories/user-digest-execution-log.repository"
import { uuidv7 } from "uuidv7"
import { TransactionManager } from "../../../../core/db"

export class DrizzleUserDigestExecutionLogRepository
  implements UserDigestExecutionLogRepository
{
  private async getDb() {
    return await TransactionManager.getConnection()
  }

  async getLastSuccessfulRunAt(
    userId: UserId,
    workerName: WorkerName,
  ): Promise<Date | null> {
    const db = await this.getDb()
    const result = await db
      .select({
        lastSuccessfulRunAt: userDigestExecutionLogs.lastSuccessfulRunAt,
      })
      .from(userDigestExecutionLogs)
      .where(
        and(
          eq(userDigestExecutionLogs.userId, userId),
          eq(userDigestExecutionLogs.workerName, workerName),
        ),
      )
      .limit(1)

    return result[0]?.lastSuccessfulRunAt ?? null
  }

  async updateLastSuccessfulRunAt(
    userId: UserId,
    workerName: WorkerName,
    timestamp: Date,
  ): Promise<void> {
    const db = await this.getDb()
    const existing = await this.findByUserAndWorker(userId, workerName)

    if (existing) {
      // 更新
      await db
        .update(userDigestExecutionLogs)
        .set({
          lastSuccessfulRunAt: timestamp,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userDigestExecutionLogs.userId, userId),
            eq(userDigestExecutionLogs.workerName, workerName),
          ),
        )
    } else {
      // 新規作成
      await db.insert(userDigestExecutionLogs).values({
        id: uuidv7(),
        userId,
        workerName,
        lastSuccessfulRunAt: timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  async findByUserAndWorker(
    userId: UserId,
    workerName: WorkerName,
  ): Promise<UserDigestExecutionLog | null> {
    const db = await this.getDb()
    const result = await db
      .select()
      .from(userDigestExecutionLogs)
      .where(
        and(
          eq(userDigestExecutionLogs.userId, userId),
          eq(userDigestExecutionLogs.workerName, workerName),
        ),
      )
      .limit(1)

    if (!result[0]) {
      return null
    }

    const row = result[0]
    return {
      id: toUserDigestExecutionLogId(row.id),
      userId: toUserId(row.userId),
      workerName: toWorkerName(row.workerName),
      lastSuccessfulRunAt: row.lastSuccessfulRunAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
