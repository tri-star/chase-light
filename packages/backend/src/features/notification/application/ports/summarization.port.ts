/**
 * Summarization Port
 * AI要約サービスのポート定義（OpenAI Structured Outputs使用）
 */

/**
 * 要約対象のアクティビティ
 */
export type SummarizationActivity = {
  activityId: string
  title: string
  body: string
  url: string
}

/**
 * 要約結果の個別アクティビティ
 */
export type SummarizedActivity = {
  activityId: string
  title: string // 日本語化されたタイトル
  summary: string // 日本語要約
}

/**
 * バッチ要約の入力パラメータ
 */
export type SummarizeActivityGroupInput = {
  dataSourceName: string
  activityType: string
  activities: SummarizationActivity[]
  language: string // 'ja' など
  maxTokens: number
}

/**
 * バッチ要約の出力
 */
export type SummarizeActivityGroupOutput = {
  summaries: SummarizedActivity[]
}

/**
 * AI要約サービスのポート
 * データソース＋種別単位でバッチ要約を生成
 */
export interface SummarizationPort {
  /**
   * アクティビティグループのバッチ要約を生成
   * OpenAI Structured Outputs を使用して、複数アクティビティを一度に処理
   *
   * @param input 要約対象のアクティビティグループ
   * @returns 各アクティビティの日本語化タイトルと要約
   * @throws タイムアウト、APIエラー等の場合
   */
  summarizeActivityGroup(
    input: SummarizeActivityGroupInput,
  ): Promise<SummarizeActivityGroupOutput>
}
