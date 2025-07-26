import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../shared/db"
import { EventRepository } from "../../repositories"
import { ProcessUpdatesService, TranslationService } from "../../services"

interface ProcessUpdatesInput {
  eventIds: string[]
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
  if (!event.eventIds || !Array.isArray(event.eventIds)) {
    console.error("Missing or invalid eventIds parameter")
    throw new Error("Invalid input: eventIds must be an array")
  }

  if (event.eventIds.length === 0) {
    console.log("No events to process")
    return { processedEventIds: [], failedEventIds: [] }
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // OpenAI APIキーを環境変数または SSM から取得
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (!openaiApiKey) {
        throw new Error("OpenAI API key not configured")
      }

      // リポジトリとサービスのインスタンス化
      const eventRepository = new EventRepository()
      const translationService = new TranslationService(openaiApiKey)

      const processUpdatesService = new ProcessUpdatesService(
        eventRepository,
        translationService,
      )

      // イベント処理実行
      console.log(`Processing ${event.eventIds.length} events`)
      const result = await processUpdatesService.execute({
        eventIds: event.eventIds,
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
