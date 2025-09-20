import { ACTIVITY_TYPE, type ActivityType } from "../../domain/activity"

export interface TranslationResponse {
  translatedTitle: string
  translatedBody: string
}

export interface TranslationOptions {
  model?: string
  maxTokens?: number
}

export const TRANSLATION_PROMPTS = {
  [ACTIVITY_TYPE.RELEASE]: `以下の<user-input>タグ内のリリースノートを日本語訳してください。
技術的な内容を正確に、開発者にとって分かりやすい日本語で翻訳してください。
バージョン番号や技術用語は適切に保持し、変更内容や新機能を明確に伝えてください。`,

  [ACTIVITY_TYPE.ISSUE]: `以下の<user-input>タグ内のIssue内容を日本語訳してください。
問題の背景と解決策を明確に伝わるように翻訳してください。
技術的な詳細や再現手順も正確に翻訳し、開発者が理解しやすい日本語にしてください。`,

  [ACTIVITY_TYPE.PULL_REQUEST]: `以下の<user-input>タグ内のPR内容を日本語訳してください。
変更内容と影響範囲が理解しやすいように翻訳してください。
コード変更の理由や技術的な改善点を明確に表現し、レビュアーが理解しやすい日本語にしてください。`,
} as const

export interface TranslationPort {
  translate(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<TranslationResponse>
}
