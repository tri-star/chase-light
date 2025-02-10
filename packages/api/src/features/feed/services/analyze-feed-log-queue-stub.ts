import type {
  AnalyzeFeedLogMessage,
  AnalyzeFeedLogQueueInterface,
} from '@/features/feed/services/analyze-feed-log-queue-interface'

export class AnalyzeFeedQueueStub implements AnalyzeFeedLogQueueInterface {
  private messages: AnalyzeFeedLogMessage[] = []

  async send(_message: AnalyzeFeedLogMessage): Promise<void> {
    console.log('Message sent:', _message)
    this.messages.push(_message)
  }
  async complete(_receiptHandle: string): Promise<void> {}

  getMessages(): AnalyzeFeedLogMessage[] {
    return this.messages
  }
}
