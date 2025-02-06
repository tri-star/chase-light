import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'
import { z } from 'zod'
import { CreateFeedLogUseCase } from '@/features/feed/usecases/create-feed-logs-usecase'
import dayjs from 'dayjs'

const createFeedLogsRequestSchema = z.string()
type CreateFeedLogRequest = z.infer<typeof createFeedLogsRequestSchema>

export type CreateFeedLogResponse = {
  id: string
  key: string
  title: string
  date: Date
}[]

export const createFeedLogsHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/create-feed-logs.handler`,
  timeout: 300,
}

export async function handler(
  event: CreateFeedLogRequest,
  _context: Context,
): Promise<CreateFeedLogResponse> {
  // const prisma = getPrismaClientInstance()

  const feedId = createFeedLogsRequestSchema.parse(event)

  const createFeedLogsUseCase = new CreateFeedLogUseCase()
  const feedLogs = await createFeedLogsUseCase.execute(feedId)

  return feedLogs.map((feedLog) => ({
    id: feedLog.id,
    key: feedLog.key,
    title: feedLog.title,
    date: dayjs(feedLog.date).toDate(),
  }))
}
