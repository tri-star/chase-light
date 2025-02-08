import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'
import { getAnalyzeFeedLogQueue } from '@/features/feed/services/analyze-feed-log-queue'
import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'

export const enqueuePendingFeedLogHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/enqueue-pending-feed-log-handler.handle`,
  timeout: 300,
}

export async function handler(
  _event: unknown,
  _context: Context,
): Promise<void> {
  const feedLogRepository = new FeedLogRepository()
  const pendingFeedLogs = await feedLogRepository.findPendingFeedLogs()

  if (pendingFeedLogs.length === 0) {
    console.info('未処理のフィードログはありません')
    return
  }

  const analyzeFeedLogQueue = getAnalyzeFeedLogQueue()

  for (const feedLog of pendingFeedLogs) {
    await analyzeFeedLogQueue.send({
      feedLogId: feedLog.id,
    })
  }
}
