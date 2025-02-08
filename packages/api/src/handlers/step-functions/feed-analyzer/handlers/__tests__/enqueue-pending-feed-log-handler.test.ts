import { swapAnalyzeFeedLogQueueForTest } from '@/features/feed/services/analyze-feed-log-queue'
import { AnalyzeFeedQueueStub } from '@/features/feed/services/analyze-feed-log-queue-stub'
import { handler } from '@/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler'
import type { Context } from 'aws-lambda'
import { describe, expect, test } from 'vitest'

describe('enqueuePendingFeedLogHandler', () => {
  test('feedLogIdがキューに送信されること', async () => {
    const analyzeFeedLogQueue = new AnalyzeFeedQueueStub()
    const feedLogId = 'feedLogId'

    swapAnalyzeFeedLogQueueForTest(analyzeFeedLogQueue)

    await handler(feedLogId, {} as Context)

    expect(analyzeFeedLogQueue.getMessages()).toEqual([
      {
        feedLogId,
      },
    ])
  })
})
