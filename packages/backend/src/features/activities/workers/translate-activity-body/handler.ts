import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleActivityTranslationStateRepository } from "../../infra"
import { BodyTranslationAdapter, BodyTranslationStubAdapter } from "../../infra"
import { ProcessActivityTranslationJobUseCase } from "../../application/use-cases"

type TranslateActivityBodyInput = {
  activityId: string
  targetLanguage?: string
}

type TranslateActivityBodyOutput = {
  translationStatus: string | null
}

const createBodyTranslationPort = () => {
  if (
    process.env.OPENAI_API_KEY &&
    process.env.USE_TRANSLATION_STUB !== "true"
  ) {
    return new BodyTranslationAdapter(process.env.OPENAI_API_KEY)
  }

  return new BodyTranslationStubAdapter()
}

export const handler = async (
  event: TranslateActivityBodyInput,
  context: Context,
): Promise<TranslateActivityBodyOutput> => {
  console.info("translate-activity-body event:", JSON.stringify(event))
  console.info("context awsRequestId:", context.awsRequestId)

  if (!event.activityId) {
    throw new Error("activityId is required")
  }

  await connectDb()

  return TransactionManager.transaction(async () => {
    const translationStateRepository =
      new DrizzleActivityTranslationStateRepository()
    const bodyTranslationPort = createBodyTranslationPort()
    const useCase = new ProcessActivityTranslationJobUseCase(
      translationStateRepository,
      bodyTranslationPort,
    )

    const result = await useCase.execute({
      activityId: event.activityId,
      targetLanguage: event.targetLanguage,
    })

    return {
      translationStatus: result?.translationStatus ?? null,
    }
  })
}
