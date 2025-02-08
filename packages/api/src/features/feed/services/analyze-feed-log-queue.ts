import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

import type { AnalyzeFeedLogQueueInterface } from '@/features/feed/services/analyze-feed-log-queue-interface'
import { z } from 'zod'

export const analyzeFeedLogMessageSchema = z.object({
  feedLogId: z.string(),
})
export type AnalyzeFeedLogMessage = z.infer<typeof analyzeFeedLogMessageSchema>

export class AnalyzeFeedLogQueue implements AnalyzeFeedLogQueueInterface {
  private queueArn

  constructor() {
    this.queueArn = process.env.ANALYZE_FEED_LOG_QUEUE_ARN
  }

  async send(_message: AnalyzeFeedLogMessage): Promise<void> {
    const sqsClient = new SQSClient()
    const command = new SendMessageCommand({
      QueueUrl: this.queueArn,
      MessageBody: JSON.stringify(_message),
    })
    await sqsClient.send(command)
  }
}

let analyzeFeedLogQueueInstance: AnalyzeFeedLogQueueInterface | undefined =
  undefined

export function getAnalyzeFeedLogQueue(): AnalyzeFeedLogQueueInterface {
  if (!analyzeFeedLogQueueInstance) {
    analyzeFeedLogQueueInstance = new AnalyzeFeedLogQueue()
  }
  return analyzeFeedLogQueueInstance
}

export function swapAnalyzeFeedLogQueueForTest(
  queue: AnalyzeFeedLogQueueInterface,
): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('swapAnalyzeFeedQueueForTestはテスト環境でのみ利用できます')
  }
  analyzeFeedLogQueueInstance = queue
}
