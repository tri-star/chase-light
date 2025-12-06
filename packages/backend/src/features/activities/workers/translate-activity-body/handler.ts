import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import {
  ProcessActivityBodyTranslationUseCase,
  type ProcessActivityBodyTranslationResult,
} from "../../application"
import { DrizzleActivityRepository } from "../../infra"
import { createActivityBodyTranslationPort } from "../../infra/adapters/translation/translation-port.factory"

type TranslateActivityBodyInput = {
  activityId: string
}

type TranslateActivityBodyOutput = ProcessActivityBodyTranslationResult

export const handler = async (
  event: TranslateActivityBodyInput,
  context: Context,
): Promise<TranslateActivityBodyOutput> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  if (!event.activityId) {
    throw new Error("Invalid input: activityId is required")
  }

  await connectDb()

  return await TransactionManager.transaction(async () => {
    const activityRepository = new DrizzleActivityRepository()
    const translationPort = await createActivityBodyTranslationPort()
    const useCase = new ProcessActivityBodyTranslationUseCase(
      activityRepository,
      translationPort,
    )

    const result = await useCase.execute({ activityId: event.activityId })
    console.log("Body translation result:", result.status)
    return result
  })
}
