import type { SQSEvent, SQSBatchResponse, Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleActivityRepository } from "../../infra/repositories"
import { ProcessUpdatesUseCase } from "../../application/use-cases"
import { createTranslationPort } from "../../infra/adapters/translation/translation-port.factory"

interface ProcessUpdatesInput {
  activityId: string
}

/**
 * process-updates Lambda関数のハンドラー
 * 検知されたイベントのAI翻訳・状態更新を行う
 */
export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<SQSBatchResponse> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  await connectDb()

  const batchItemFailures: { itemIdentifier: string }[] = []

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as ProcessUpdatesInput

      if (!payload.activityId) {
        console.error("Missing activityId, skipping record:", record.messageId)
        continue
      }

      await TransactionManager.transaction(async () => {
        const activityRepository = new DrizzleActivityRepository()
        const translationAdapter = await createTranslationPort()

        const processUpdatesService = new ProcessUpdatesUseCase(
          activityRepository,
          translationAdapter,
        )

        await processUpdatesService.execute({
          activityIds: [payload.activityId],
        })
      })

      console.log(`Successfully processed activity: ${payload.activityId}`)
    } catch (error) {
      console.error(`Failed to process record ${record.messageId}:`, error)
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures }
}
