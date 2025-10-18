import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import {
  DrizzleNotificationRepository,
  DrizzleRecipientRepository,
  DrizzleActivitySubscriberRepository,
} from "../../infra/repositories"
import { CreateNotificationsUseCase } from "../../application/use-cases"
import { toActivityId } from "../../domain/notification"

interface CreateNotificationsInput {
  activityIds?: string[]
  limit?: number
}

interface CreateNotificationsOutput {
  createdCount: number
  updatedCount: number
  failedActivityIds: string[]
}

/**
 * create-notifications Lambda関数のハンドラー
 * アクティビティから購読ユーザーを解決し、Notificationレコードを生成する
 */
export const handler = async (
  event: CreateNotificationsInput,
  context: Context,
): Promise<CreateNotificationsOutput> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // リポジトリのインスタンス化
      const notificationRepository = new DrizzleNotificationRepository()
      const recipientRepository = new DrizzleRecipientRepository()
      const activitySubscriberRepository =
        new DrizzleActivitySubscriberRepository()

      const createNotificationsUseCase = new CreateNotificationsUseCase(
        notificationRepository,
        recipientRepository,
        activitySubscriberRepository,
      )

      // Notification生成実行
      const activityIdsCount = event.activityIds?.length ?? 0
      const limit = event.limit ?? 100
      console.log(
        activityIdsCount > 0
          ? `Processing ${activityIdsCount} specified activities`
          : `Processing up to ${limit} unprocessed activities`,
      )

      const result = await createNotificationsUseCase.execute({
        activityIds: event.activityIds?.map((id) => toActivityId(id)),
        limit: event.limit,
      })

      console.log(
        `Notification creation completed. ` +
          `Created: ${result.createdCount}, ` +
          `Updated: ${result.updatedCount}, ` +
          `Failed: ${result.failedActivityIds.length}`,
      )

      return result
    })
  } catch (error) {
    console.error("Error in create-notifications handler:", error)

    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // エラーを再スロー（StepFunctionsでエラーハンドリング）
    throw error
  }
}
