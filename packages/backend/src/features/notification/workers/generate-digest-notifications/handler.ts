import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"

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
    // TODO: Phase 7でユーザー単位の処理に改修する
    // 現在は暫定的に空の結果を返す
    const result = {
      created: 0,
      skippedByConflict: 0,
      totalExamined: 0,
      lastProcessedActivityId: null,
    }

    console.info("generate-digest-notifications result:", result)

    return result
  })
}
