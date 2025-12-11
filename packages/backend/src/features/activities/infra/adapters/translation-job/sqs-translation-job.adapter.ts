import {
  SQSClient,
  SendMessageCommand,
  type SendMessageCommandInput,
} from "@aws-sdk/client-sqs"
import { getSqsConfig } from "../../../../../core/config/sqs"
import type {
  EnqueueTranslationJobResult,
  TranslationJobPayload,
  TranslationJobQueuePort,
} from "../../../application/ports/translation-job-queue.port"

export class SqsTranslationJobAdapter implements TranslationJobQueuePort {
  private readonly client: SQSClient
  private readonly queueUrl: string

  constructor() {
    const config = getSqsConfig()
    this.queueUrl = config.translationQueueUrl
    this.client = new SQSClient({
      region: config.region,
      endpoint: config.endpoint,
    })
  }

  async enqueue(
    job: TranslationJobPayload,
  ): Promise<EnqueueTranslationJobResult> {
    const message: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(job),
    }

    const result = await this.client.send(new SendMessageCommand(message))

    return { messageId: result.MessageId ?? null }
  }
}
