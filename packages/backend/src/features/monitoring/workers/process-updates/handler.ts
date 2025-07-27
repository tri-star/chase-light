import type { Context, SQSEvent } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../shared/db"
import { getOpenAiConfig } from "../../../../shared/config/open-ai"
import { EventRepository } from "../../repositories"
import { ProcessUpdatesService, createTranslationService } from "../../services"

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

/**
 * SQSトリガー用のprocess-updates Lambda関数のハンドラー
 * SQSから単一のイベントIDを受信して処理する
 */
export const sqsHandler = async (
  event: SQSEvent,
  context: Context,
): Promise<void> => {
  console.log("SQS Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  try {
    // データベース接続を確立
    await connectDb()

    // 各SQSメッセージを処理
    for (const record of event.Records) {
      try {
        const messageBody = JSON.parse(record.body)
        const eventId = messageBody.eventId

        if (!eventId || typeof eventId !== "string") {
          console.error("Invalid eventId in SQS message:", messageBody)
          continue
        }

        console.log(`Processing single event: ${eventId}`)

        // 単一イベントを処理
        await processSingleEvent(eventId)

        console.log(`Successfully processed event: ${eventId}`)
      } catch (error) {
        console.error("Error processing SQS record:", {
          messageId: record.messageId,
          error: error instanceof Error ? error.message : error,
          errorStack: error instanceof Error ? error.stack : undefined,
          record,
        })

        // SQSでは個別のメッセージの失敗はエラーをスローして再試行させる
        throw error
      }
    }
  } catch (error) {
    console.error("Error in SQS handler:", error)
    throw error
  }
}

/**
 * 単一イベントの処理を行う共通関数
 */
async function processSingleEvent(eventId: string): Promise<void> {
  await TransactionManager.transaction(async () => {
    // OpenAI APIキーを環境に応じて取得
    const openAiConfig = await getOpenAiConfig()

    // リポジトリとサービスのインスタンス化
    const eventRepository = new EventRepository()
    const translationService = createTranslationService(openAiConfig.apiKey)

    const processUpdatesService = new ProcessUpdatesService(
      eventRepository,
      translationService,
    )

    // 単一イベント処理
    const result = await processUpdatesService.execute({
      eventIds: [eventId],
    })

    if (result.failedEventIds.length > 0) {
      throw new Error(`Failed to process event ${eventId}`)
    }
  })
}
