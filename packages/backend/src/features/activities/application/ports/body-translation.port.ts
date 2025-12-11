import type { ActivityBodyTranslationTargetLanguage } from "shared/constants"

export type BodyTranslationResult = {
  translatedBody: string
}

export type BodyTranslationOptions = {
  model?: string
  maxTokens?: number
}

export interface BodyTranslationPort {
  translate(
    body: string,
    targetLanguage?: ActivityBodyTranslationTargetLanguage,
    options?: BodyTranslationOptions,
  ): Promise<BodyTranslationResult>
}
