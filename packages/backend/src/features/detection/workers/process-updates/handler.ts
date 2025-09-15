import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { getOpenAiConfig } from "../../../../core/config/open-ai"
import { ActivityRepository } from "../../repositories"
import { ProcessUpdatesService, createTranslationService } from "../../services"

interface ProcessUpdatesInput {
  activityId: string
}

interface ProcessUpdatesOutput {
  processedActivityIds: string[]
  failedActivityIds: string[]
}

/**
 * process-updates Lambda関数のハンドラー
 * 検知されたイベントのAI翻訳・状態更新を行う
 */
export const handler = async (
  event: ProcessUpdatesInput,
  context: Context,
): Promise<ProcessUpdatesOutput> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  // 入力検証
  if (!event.activityId) {
    console.error("Missing or invalid activityId parameter")
    throw new Error("Invalid input: activityId must be a string")
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // OpenAI APIキーを環境に応じて取得（AWS環境はSSM、ローカル環境は環境変数）
      const openAiConfig = await getOpenAiConfig()

      // リポジトリとサービスのインスタンス化
      const activityRepository = new ActivityRepository()
      const translationService = createTranslationService(openAiConfig.apiKey)

      const processUpdatesService = new ProcessUpdatesService(
        activityRepository,
        translationService,
      )

      // イベント処理実行
      console.log(`Processing 1 activity`)
      const result = await processUpdatesService.execute({
        activityIds: [event.activityId],
      })

      console.log(
        `Processing completed. ` +
          `Processed: ${result.processedActivityIds.length}, ` +
          `Failed: ${result.failedActivityIds.length}`,
      )

      return result
    })
  } catch (error) {
    console.error("Error in process-updates handler:", error)

    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // エラーを再スロー（StepFunctionsでエラーハンドリング）
    throw error
  }
}
