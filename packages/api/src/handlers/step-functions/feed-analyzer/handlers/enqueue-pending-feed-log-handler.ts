import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'
import { z } from 'zod'
import { getAnalyzeFeedLogQueue } from '@/features/feed/services/analyze-feed-log-queue'

const enqueueFeedLogsRequestSchema = z.string()
type EnqueueFeedLogRequest = z.infer<typeof enqueueFeedLogsRequestSchema>

export const enqueuePendingFeedLogHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/enqueue-pending-feed-log-handler.handle`,
  timeout: 300,
}

export async function handler(
  event: EnqueueFeedLogRequest,
  _context: Context,
): Promise<void> {
  const feedLogId = enqueueFeedLogsRequestSchema.parse(event)

  const analyzeFeedLogQueue = getAnalyzeFeedLogQueue()

  await analyzeFeedLogQueue.send({
    feedLogId,
  })
}
