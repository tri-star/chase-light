import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { getOpenAiConfig } from "../../../../core/config/open-ai"
import { GenerateDigestNotificationsUseCase } from "../../application/use-cases/generate-digest-notifications.use-case"
import {
  DrizzleDigestNotificationRepository,
  DrizzleDigestPreparationRepository,
  DrizzleDigestUserStateRepository,
} from "../../infra/repositories"
import {
  createSummarizationAdapter,
  SummarizationAdapterOptions,
} from "../../infra/adapters/summarization/summarization.adapter"
import {
  createStubSummarizationAdapter,
  StubSummarizationAdapterOptions,
} from "../../infra/adapters/summarization/stub-summarization.adapter"
import type { SummarizationPort } from "../../application/ports/summarization.port"
import type { DigestWindowSummary } from "../../application/use-cases/generate-digest-notifications.use-case"

export type GenerateDigestNotificationsInput = {
  limit?: number
  dryRun?: boolean
  since?: string
  until?: string
}

export type GenerateDigestNotificationsOutput = {
  created: number
  skippedByConflict: number
  totalExamined: number
  processedUsers: number
  windowSummaries: DigestWindowSummary[]
}

export const handler = async (
  event: GenerateDigestNotificationsInput,
  context: Context,
): Promise<GenerateDigestNotificationsOutput> => {
  console.info("generate-digest-notifications event:", JSON.stringify(event))
  console.info("Context requestId:", context.awsRequestId)

  await connectDb()

  const summarizationPort = await createSummarizationPort()

  return await TransactionManager.transaction(async () => {
    const preparationRepository = new DrizzleDigestPreparationRepository()
    const notificationRepository = new DrizzleDigestNotificationRepository()
    const userStateRepository = new DrizzleDigestUserStateRepository()

    const useCase = new GenerateDigestNotificationsUseCase(
      preparationRepository,
      notificationRepository,
      userStateRepository,
      summarizationPort,
    )

    const result = await useCase.execute({
      limit: event.limit,
      dryRun: event.dryRun,
      since: parseDate(event.since),
      until: parseDate(event.until),
    })

    console.info("generate-digest-notifications result:", {
      created: result.created,
      skippedByConflict: result.skippedByConflict,
      totalExamined: result.totalExamined,
      processedUsers: result.processedUsers,
    })

    return result
  })
}

async function createSummarizationPort(): Promise<SummarizationPort> {
  if (process.env.NOTIFICATION_SUMMARIZATION_ADAPTER === "stub") {
    const options = parseStubAdapterOptions()
    return createStubSummarizationAdapter(options)
  }

  const config = await getOpenAiConfig()
  const adapterOptions = parseSummarizationAdapterOptions()
  return createSummarizationAdapter(config.apiKey, adapterOptions)
}

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function parseSummarizationAdapterOptions(): SummarizationAdapterOptions {
  const model = process.env.NOTIFICATION_SUMMARIZATION_MODEL
  const maxTokens = process.env.NOTIFICATION_SUMMARIZATION_MAX_TOKENS
  const temperature = process.env.NOTIFICATION_SUMMARIZATION_TEMPERATURE

  return {
    model: model ?? undefined,
    maxTokens: maxTokens ? Number(maxTokens) : undefined,
    temperature: temperature ? Number(temperature) : undefined,
  }
}

function parseStubAdapterOptions(): StubSummarizationAdapterOptions {
  const skip = process.env.NOTIFICATION_SUMMARIZATION_SKIP_GROUPS
  const fallback = process.env.NOTIFICATION_SUMMARIZATION_FALLBACK_GROUPS

  return {
    skipGroupIds: skip ? skip.split(",").map((value) => value.trim()) : [],
    fallbackGroupIds: fallback
      ? fallback.split(",").map((value) => value.trim())
      : [],
  }
}
