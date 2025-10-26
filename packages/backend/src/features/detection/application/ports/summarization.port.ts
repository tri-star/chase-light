import { ACTIVITY_TYPE, type ActivityType } from "../../domain/activity"

export interface SummarizationResponse {
  summary: string
}

export interface SummarizationOptions {
  model?: string
  maxTokens?: number
}

export const SUMMARIZATION_PROMPTS = {
  [ACTIVITY_TYPE.RELEASE]: `以下の<user-input>タグ内のリリースノートを簡潔に要約してください。
主要な変更点、新機能、重要なバグ修正を箇条書きでまとめてください。
開発者が一目で変更内容を把握できるよう、100-200文字程度で要約してください。`,

  [ACTIVITY_TYPE.ISSUE]: `以下の<user-input>タグ内のIssue内容を簡潔に要約してください。
問題の本質と解決策を端的にまとめてください。
開発者が素早く内容を理解できるよう、100-200文字程度で要約してください。`,

  [ACTIVITY_TYPE.PULL_REQUEST]: `以下の<user-input>タグ内のPR内容を簡潔に要約してください。
主な変更内容と影響範囲を端的にまとめてください。
開発者が変更の概要を素早く理解できるよう、100-200文字程度で要約してください。`,
} as const

export interface SummarizationPort {
  summarize(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<SummarizationResponse>
}
