import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { getOpenAiConfig } from "../../../../core/config/open-ai"
import { EventRepository } from "../../repositories"
import { ProcessUpdatesService, createTranslationService } from "../../services"

interface ProcessUpdatesInput {
  eventId: string
}

interface ProcessUpdatesOutput {
  processedEventIds: string[]
  failedEventIds: string[]
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
  if (!event.eventId) {
    console.error("Missing or invalid eventId parameter")
    throw new Error("Invalid input: eventId must be a string")
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // OpenAI APIキーを環境に応じて取得（AWS環境はSSM、ローカル環境は環境変数）
      const openAiConfig = await getOpenAiConfig()

      // リポジトリとサービスのインスタンス化
      const eventRepository = new EventRepository()
      const translationService = createTranslationService(openAiConfig.apiKey)

      const processUpdatesService = new ProcessUpdatesService(
        eventRepository,
        translationService,
      )

      // イベント処理実行
      console.log(`Processing 1 event`)
      const result = await processUpdatesService.execute({
        eventIds: [event.eventId],
      })

      console.log(
        `Processing completed. ` +
          `Processed: ${result.processedEventIds.length}, ` +
          `Failed: ${result.failedEventIds.length}`,
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
