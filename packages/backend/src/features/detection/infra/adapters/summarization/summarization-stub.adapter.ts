import { SummarizationResponse } from "../../../application/ports/summarization.port"
import { type ActivityType } from "../../../domain/activity"

/**
 * SummarizationServiceのスタブ実装
 * テスト用およびローカル開発環境用
 */
export class SummarizationAdapterStub {
  async summarize(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<SummarizationResponse> {
    // スタブ実装: 固定の要約を返す
    const truncatedBody =
      body.length > 50 ? body.substring(0, 50) + "..." : body
    return {
      summary: `[要約] ${title} - ${truncatedBody}\n※これはテスト用のスタブ要約です。実際のAI要約は本番環境で実行されます。`,
    }
  }
}
