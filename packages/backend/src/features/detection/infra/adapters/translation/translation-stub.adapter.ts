import {
  type TranslationPort,
  type TranslationResponse,
} from "../../../application/ports/translation.port"
import { type ActivityType } from "../../../domain/activity"

type TranslationStubHandler = (input: {
  activityType: ActivityType
  title: string
  body: string
}) => TranslationResponse | Promise<TranslationResponse>

/**
 * TranslationServiceのスタブ実装
 * テスト用およびローカル開発環境用
 */
export class TranslationAdapterStub implements TranslationPort {
  private handler: TranslationStubHandler

  constructor(handler?: TranslationStubHandler) {
    this.handler = handler ?? this.getDefaultHandler()
  }

  configure(handler: TranslationStubHandler): void {
    this.handler = handler
  }

  reset(): void {
    this.handler = this.getDefaultHandler()
  }

  async translate(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<TranslationResponse> {
    return await this.handler({ activityType, title, body })
  }

  private getDefaultHandler(): TranslationStubHandler {
    return ({ activityType, title }) => ({
      translatedTitle: `[翻訳済み] ${title}`,
      summary: `【テスト要約:${activityType}】${title}`,
      translatedBody: null,
    })
  }
}

export function createTranslationAdapterStub(
  handler?: TranslationStubHandler,
): TranslationAdapterStub {
  return new TranslationAdapterStub(handler)
}
