import { type EventType } from "../domain/event"

interface TranslationResponse {
  translatedTitle: string
  translatedBody: string
}

/**
 * TranslationServiceのスタブ実装
 * テスト用およびローカル開発環境用
 */
export class TranslationServiceStub {
  async translate(
    eventType: EventType,
    title: string,
    body: string,
  ): Promise<TranslationResponse> {
    // スタブ実装: 固定の日本語翻訳を返す
    return {
      translatedTitle: `[翻訳済み] ${title}`,
      translatedBody: `[翻訳済み] ${body}\n\n※これはテスト用のスタブ翻訳です。実際のAI翻訳は本番環境で実行されます。`,
    }
  }
}
