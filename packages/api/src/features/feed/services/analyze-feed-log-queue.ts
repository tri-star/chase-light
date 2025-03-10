import {
  DeleteMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'

import type { AnalyzeFeedLogQueueInterface } from '@/features/feed/services/analyze-feed-log-queue-interface'
import { z } from 'zod'
import { AnalyzeFeedQueueStub } from '@/features/feed/services/analyze-feed-log-queue-stub'

export const analyzeFeedLogMessageSchema = z.object({
  feedLogId: z.string(),
})
export type AnalyzeFeedLogMessage = z.infer<typeof analyzeFeedLogMessageSchema>

export class AnalyzeFeedLogQueue implements AnalyzeFeedLogQueueInterface {
  private queueUrl

  constructor() {
    this.queueUrl = process.env.ANALYZE_FEED_LOG_QUEUE_URL
  }

  async send(_message: AnalyzeFeedLogMessage): Promise<void> {
    const sqsClient = new SQSClient()
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(_message),
    })
    await sqsClient.send(command)
  }

  async complete(receiptHandle: string): Promise<void> {
    const sqsClient = new SQSClient()
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    })
    await sqsClient.send(command)
  }
}

let analyzeFeedLogQueueInstance: AnalyzeFeedLogQueueInterface | undefined =
  undefined

export function getAnalyzeFeedLogQueue(): AnalyzeFeedLogQueueInterface {
  if (!analyzeFeedLogQueueInstance) {
    if (process.env.STAGE === 'local') {
      analyzeFeedLogQueueInstance = new AnalyzeFeedQueueStub()
    } else {
      analyzeFeedLogQueueInstance = new AnalyzeFeedLogQueue()
    }
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
