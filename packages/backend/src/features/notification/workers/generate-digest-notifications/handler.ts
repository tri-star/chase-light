import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleNotificationPreparationRepository } from "../../infra/repositories/drizzle-notification-preparation.repository"
import { DrizzleNotificationRepository } from "../../infra/repositories/drizzle-notification.repository"
import { DrizzleUserDigestExecutionLogRepository } from "../../infra/repositories/drizzle-user-digest-execution-log.repository"
import { GenerateDigestNotificationsUseCase } from "../../application/use-cases/generate-digest-notifications.use-case"
import { SummarizationStubAdapter } from "../../infra/adapters/summarization/summarization-stub.adapter"
import { SummarizationAdapter } from "../../infra/adapters/summarization/summarization.adapter"
import {
  MAX_DAYS_LOOKBACK,
  WORKER_NAME_GENERATE_DIGEST,
} from "../../constants/notification.constants"
import { toUserId, toWorkerName } from "../../domain/user-digest-execution-log"
import { eq } from "drizzle-orm"
import { users, userPreferences } from "../../../../db/schema"

export type GenerateDigestNotificationsInput = {
  /**
   * 処理対象のユーザーIDリスト（指定しない場合は全ユーザー）
   */
  userIds?: string[]
  /**
   * dry-runモード（通知を実際には作成しない）
   */
  dryRun?: boolean
  /**
   * テストモード（AI要約にスタブを使用）
   */
  useStubSummarization?: boolean
}

export type GenerateDigestNotificationsOutput = {
  totalUsers: number
  successUsers: number
  failedUsers: number
  totalNotifications: number
  totalActivities: number
  errors: Array<{
    userId: string
    error: string
  }>
}

export const handler = async (
  event: GenerateDigestNotificationsInput,
  context: Context,
): Promise<GenerateDigestNotificationsOutput> => {
  console.info("generate-digest-notifications event:", JSON.stringify(event))
  console.info("Context requestId:", context.awsRequestId)

  await connectDb()

  const output: GenerateDigestNotificationsOutput = {
    totalUsers: 0,
    successUsers: 0,
    failedUsers: 0,
    totalNotifications: 0,
    totalActivities: 0,
    errors: [],
  }

  // 1. 処理対象ユーザー一覧を取得
  const targetUserIds = await getTargetUsers(event.userIds)
  output.totalUsers = targetUserIds.length

  if (targetUserIds.length === 0) {
    console.info("No target users found")
    return output
  }

  console.info(`Processing ${targetUserIds.length} users`)

  // 2. 各ユーザーに対して処理を実行
  for (const userId of targetUserIds) {
    try {
      await TransactionManager.transaction(async () => {
        const preparationRepository =
          new DrizzleNotificationPreparationRepository()
        const notificationRepository = new DrizzleNotificationRepository()
        const executionLogRepository =
          new DrizzleUserDigestExecutionLogRepository()

        // AI要約アダプタの選択（テストモードならスタブを使用）
        const summarizationPort = event.useStubSummarization
          ? new SummarizationStubAdapter()
          : new SummarizationAdapter()

        const useCase = new GenerateDigestNotificationsUseCase(
          preparationRepository,
          notificationRepository,
          summarizationPort,
        )

        // ユーザーの最終成功実行時刻を取得
        const lastSuccessfulRunAt =
          await executionLogRepository.getLastSuccessfulRunAt(
            toUserId(userId),
            toWorkerName(WORKER_NAME_GENERATE_DIGEST),
          )

        // 時間範囲を計算
        const now = new Date()
        const maxLookbackDate = new Date(now)
        maxLookbackDate.setDate(maxLookbackDate.getDate() - MAX_DAYS_LOOKBACK)

        const fromDate = lastSuccessfulRunAt
          ? new Date(
              Math.max(
                lastSuccessfulRunAt.getTime(),
                maxLookbackDate.getTime(),
              ),
            )
          : maxLookbackDate

        console.info(
          `Processing user ${userId}: from ${fromDate.toISOString()} to ${now.toISOString()}`,
        )

        // ユーザー単位でダイジェスト通知を生成
        const result = await useCase.executeForUser({
          userId,
          timeRange: {
            from: fromDate,
            to: now,
          },
          dryRun: event.dryRun,
        })

        // 成功したら実行時刻を更新
        if (!event.dryRun) {
          await executionLogRepository.updateLastSuccessfulRunAt(
            toUserId(userId),
            toWorkerName(WORKER_NAME_GENERATE_DIGEST),
            now,
          )
        }

        output.successUsers++
        output.totalNotifications += result.created
        output.totalActivities += result.totalActivities

        console.info(`User ${userId} processed successfully:`, result)
      })
    } catch (error) {
      output.failedUsers++
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      output.errors.push({
        userId,
        error: errorMessage,
      })
      console.error(`Failed to process user ${userId}:`, error)
    }
  }

  console.info("generate-digest-notifications completed:", output)

  return output
}

/**
 * 処理対象ユーザーを取得
 */
async function getTargetUsers(specifiedUserIds?: string[]): Promise<string[]> {
  const connection = await TransactionManager.getConnection()

  // ユーザーIDが指定されている場合はそれを使用
  if (specifiedUserIds && specifiedUserIds.length > 0) {
    return specifiedUserIds
  }

  // 全ユーザーを取得（digestEnabled=trueのユーザーのみ）
  const rows = await connection
    .select({
      userId: users.id,
    })
    .from(users)
    .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(eq(userPreferences.digestEnabled, true))

  return rows.map((row) => row.userId)
}
