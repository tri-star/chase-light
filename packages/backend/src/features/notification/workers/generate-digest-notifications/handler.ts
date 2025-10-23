import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { GenerateDigestNotificationsUseCase } from "../../application/use-cases/generate-digest-notifications.use-case"
import { DrizzleDigestPreparationRepository } from "../../infra/repositories/drizzle-digest-preparation.repository"
import { DrizzleDigestNotificationRepository } from "../../infra/repositories/drizzle-digest-notification.repository"
import { DrizzleDigestUserStateRepository } from "../../infra/repositories/drizzle-digest-user-state.repository"
import { createSummarizationPort } from "../../infra/adapters/summarization/summarization-port.factory"
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

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}
