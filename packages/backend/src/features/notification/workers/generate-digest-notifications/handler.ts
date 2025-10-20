import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleNotificationPreparationRepository } from "../../infra/repositories/drizzle-notification-preparation.repository"
import { DrizzleNotificationRepository } from "../../infra/repositories/drizzle-notification.repository"
import { GenerateDigestNotificationsUseCase } from "../../application/use-cases/generate-digest-notifications.use-case"

export type GenerateDigestNotificationsInput = {
  limit?: number
  activityIds?: string[]
  dryRun?: boolean
}

export type GenerateDigestNotificationsOutput = {
  created: number
  skippedByConflict: number
  totalExamined: number
  lastProcessedActivityId: string | null
}

export const handler = async (
  event: GenerateDigestNotificationsInput,
  context: Context,
): Promise<GenerateDigestNotificationsOutput> => {
  console.info("generate-digest-notifications event:", JSON.stringify(event))
  console.info("Context requestId:", context.awsRequestId)

  await connectDb()

  return await TransactionManager.transaction(async () => {
    const preparationRepository = new DrizzleNotificationPreparationRepository()
    const notificationRepository = new DrizzleNotificationRepository()

    const useCase = new GenerateDigestNotificationsUseCase(
      preparationRepository,
      notificationRepository,
    )

    const result = await useCase.execute({
      limit: event.limit,
      activityIds: event.activityIds,
      dryRun: event.dryRun,
    })

    console.info("generate-digest-notifications result:", result)

    return result
  })
}
