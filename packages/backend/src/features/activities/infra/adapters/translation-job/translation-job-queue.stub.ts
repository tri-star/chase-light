import type {
  EnqueueTranslationJobResult,
  TranslationJobPayload,
  TranslationJobQueuePort,
} from "../../../application/ports/translation-job-queue.port"

export class TranslationJobQueueStub implements TranslationJobQueuePort {
  public enqueued: TranslationJobPayload[] = []
  public messageId = "stub-message-id"

  async enqueue(
    job: TranslationJobPayload,
  ): Promise<EnqueueTranslationJobResult> {
    this.enqueued.push(job)
    return { messageId: this.messageId }
  }
}
