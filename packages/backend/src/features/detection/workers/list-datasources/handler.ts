import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { DrizzleDetectTargetRepository } from "../../infra/repositories/drizzle-detect-target.repository"

interface ListDataSourcesInput {
  sourceType?: string
}

interface ListDataSourcesOutput {
  dataSources: Array<{
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
  event: ListDataSourcesInput,
  context: Context,
): Promise<ListDataSourcesOutput> => {
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
      dataSources: result.dataSources.map((dataSource) => ({
        id: dataSource.id,
        sourceType: dataSource.sourceType,
        sourceId: dataSource.sourceId,
        name: dataSource.name,
        description: dataSource.description,
        url: dataSource.url,
        isPrivate: dataSource.isPrivate,
        createdAt: dataSource.createdAt.toISOString(),
        updatedAt: dataSource.updatedAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("Error in list-datasources handler:", error)
    throw error
  }
}
