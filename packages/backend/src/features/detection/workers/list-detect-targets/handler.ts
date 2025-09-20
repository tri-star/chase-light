import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { DrizzleDetectTargetRepository } from "../../infra/repositories/drizzle-detect-target.repository"

interface ListDetectTargetsInput {
  sourceType?: string
}

interface ListDetectTargetsOutput {
  detectTargets: Array<{
    id: string
    sourceType: string
    sourceId: string
    name: string
    description: string
    url: string
    isPrivate: boolean
    createdAt: string
    updatedAt: string
  }>
}

export const handler = async (
  event: ListDetectTargetsInput,
  context: Context,
): Promise<ListDetectTargetsOutput> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  try {
    // データベース接続を確立
    await connectDb()

    const detectTargetRepository = new DrizzleDetectTargetRepository()

    const result = await detectTargetRepository.listDetectTargets({
      sourceType: event.sourceType,
    })

    return {
      detectTargets: result.detectTargets.map((detectTarget) => ({
        id: detectTarget.id,
        sourceType: detectTarget.sourceType,
        sourceId: detectTarget.sourceId,
        name: detectTarget.name,
        description: detectTarget.description,
        url: detectTarget.url,
        isPrivate: detectTarget.isPrivate,
        createdAt: detectTarget.createdAt.toISOString(),
        updatedAt: detectTarget.updatedAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("Error in list-datasources handler:", error)
    throw error
  }
}
