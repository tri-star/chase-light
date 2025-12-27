/**
 * 翻訳ステータス
 */
export type TranslationStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'

/**
 * 翻訳状態
 */
export interface TranslationState {
  /** SQS MessageId等のジョブ識別子 */
  jobId: string | null
  /** 翻訳ステータス */
  translationStatus: TranslationStatus
  /** ステータス詳細 */
  statusDetail: string | null
  /** リクエスト日時 */
  requestedAt: string
  /** 開始日時 */
  startedAt: string | null
  /** 完了日時 */
  completedAt: string | null
}

/**
 * 翻訳リクエストパラメータ
 */
export interface TranslationRequestParams {
  /** true の場合、完了済みでも再翻訳を許可 */
  force?: boolean
  /** 翻訳対象言語（省略時は ja） */
  targetLanguage?: 'ja'
}
