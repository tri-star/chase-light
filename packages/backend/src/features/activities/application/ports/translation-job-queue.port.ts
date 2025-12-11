import type { ActivityBodyTranslationTargetLanguage } from "shared/constants"

export type TranslationJobPayload = {
  activityId: string
  targetLanguage: ActivityBodyTranslationTargetLanguage
}

export type EnqueueTranslationJobResult = {
  messageId: string | null
}

export interface TranslationJobQueuePort {
  enqueue(job: TranslationJobPayload): Promise<EnqueueTranslationJobResult>
}
