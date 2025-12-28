import type { SQSEvent, SQSBatchResponse, Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleActivityTranslationStateRepository } from "../../infra"
import { ProcessActivityTranslationJobUseCase } from "../../application/use-cases"
import { createBodyTranslationPort } from "../../infra/adapters/translation/body-translation.factory"

type TranslateActivityBodyInput = {
  activityId: string
  targetLanguage?: string
}

export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<SQSBatchResponse> => {
  console.info("translate-activity-body SQS event:", JSON.stringify(event))
  console.info("context awsRequestId:", context.awsRequestId)

  await connectDb()

  const batchItemFailures: { itemIdentifier: string }[] = []

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as TranslateActivityBodyInput

      if (!payload.activityId) {
        console.error(
          "activityId is required, skipping record:",
          record.messageId,
        )
        continue
      }

      await TransactionManager.transaction(async () => {
        const translationStateRepository =
          new DrizzleActivityTranslationStateRepository()
        const bodyTranslationPort = await createBodyTranslationPort()
        const useCase = new ProcessActivityTranslationJobUseCase(
          translationStateRepository,
          bodyTranslationPort,
        )

        await useCase.execute({
          activityId: payload.activityId,
          targetLanguage: payload.targetLanguage,
        })
      })

      console.info(`Successfully processed activity: ${payload.activityId}`)
    } catch (error) {
      console.error(`Failed to process record ${record.messageId}:`, error)
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures }
}
