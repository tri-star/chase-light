import type {
  TranslationPort,
  TranslationResponse,
} from "../../../application/ports/translation.port"
import type { ActivityType } from "../../../domain/activity"

/**
 * OpenAI APIキーが未設定の場合に使用するフォールバック実装
 * 翻訳や要約は行わず、nullを返す
 */
export class NullTranslationAdapter implements TranslationPort {
  async translate(
    _activityType: ActivityType,
    _title: string,
    _body: string,
  ): Promise<TranslationResponse> {
    return {
      translatedTitle: null,
      summary: null,
      translatedBody: null,
    }
  }
}
