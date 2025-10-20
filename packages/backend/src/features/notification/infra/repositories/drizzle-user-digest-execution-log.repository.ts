/**
 * Drizzle User Digest Execution Log Repository
 * ユーザー単位実行履歴リポジトリの実装
 */

import { eq, and } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
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

export class DrizzleUserDigestExecutionLogRepository
  implements UserDigestExecutionLogRepository
{
  constructor(private db: PostgresJsDatabase) {}

  async getLastSuccessfulRunAt(
    userId: UserId,
    workerName: WorkerName,
  ): Promise<Date | null> {
    const result = await this.db
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
    const existing = await this.findByUserAndWorker(userId, workerName)

    if (existing) {
      // 更新
      await this.db
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
      await this.db.insert(userDigestExecutionLogs).values({
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
    const result = await this.db
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
