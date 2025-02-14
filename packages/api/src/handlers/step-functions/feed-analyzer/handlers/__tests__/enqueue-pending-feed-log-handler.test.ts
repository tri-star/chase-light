import { swapAnalyzeFeedLogQueueForTest } from '@/features/feed/services/analyze-feed-log-queue'
import { AnalyzeFeedQueueStub } from '@/features/feed/services/analyze-feed-log-queue-stub'
import { handler } from '@/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler'
import type { Context } from 'aws-lambda'
import { FEED_LOG_STATUS_VALUE_MAP } from 'core/features/feed/feed-logs'
import { feedLogFactory } from 'prisma/seeds/feed-log-factory'
import { describe, expect, test } from 'vitest'

describe('enqueuePendingFeedLogHandler', () => {
  test('wait, error状態のフィードログがキューに投入されること', async () => {
    const analyzeFeedLogQueue = new AnalyzeFeedQueueStub()

    const waitingFeedLog = await feedLogFactory.create({
      status: FEED_LOG_STATUS_VALUE_MAP.WAIT,
    })
    await feedLogFactory.create({
      status: FEED_LOG_STATUS_VALUE_MAP.DONE,
    })
    await feedLogFactory.create({
      status: FEED_LOG_STATUS_VALUE_MAP.failed,
    })
    const erroredFeedLog = await feedLogFactory.create({
      status: FEED_LOG_STATUS_VALUE_MAP.ERROR,
    })

    swapAnalyzeFeedLogQueueForTest(analyzeFeedLogQueue)

    await handler(undefined, {} as Context)

    // 順序を意識しないためSetで比較
    expect(new Set(analyzeFeedLogQueue.getMessages())).toEqual(
      new Set([
        {
          feedLogId: waitingFeedLog.id,
        },
        {
          feedLogId: erroredFeedLog.id,
        },
      ]),
    )
  })
})
