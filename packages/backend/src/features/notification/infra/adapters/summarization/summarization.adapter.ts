/**
 * Summarization Adapter
 * OpenAI Structured Outputs を使用したAI要約の実装
 */

import OpenAI from "openai"
import { z } from "zod"
import type {
  SummarizationPort,
  SummarizeActivityGroupInput,
  SummarizeActivityGroupOutput,
} from "../../../application/ports/summarization.port"
import {
  SUMMARIZATION_TIMEOUT_MS,
  DEFAULT_FALLBACK_SUMMARY,
} from "../../../constants/notification.constants"

/**
 * OpenAI Structured Outputs用のZodスキーマ
 */
const ActivitySummarySchema = z.object({
  activityId: z.string(),
  title: z.string().describe("日本語化されたタイトル"),
  summary: z.string().describe("日本語の要約（100文字程度）"),
})

const ActivityGroupSummarySchema = z.object({
  summaries: z
    .array(ActivitySummarySchema)
    .describe("各アクティビティの要約リスト"),
})

export class SummarizationAdapter implements SummarizationPort {
  private client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      timeout: SUMMARIZATION_TIMEOUT_MS,
    })
  }

  async summarizeActivityGroup(
    input: SummarizeActivityGroupInput,
  ): Promise<SummarizeActivityGroupOutput> {
    try {
      // プロンプト生成
      const systemPrompt = this.buildSystemPrompt(input.language)
      const userPrompt = this.buildUserPrompt(input)

      // OpenAI Structured Outputs で一括要約
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: input.maxTokens,
      })

      const content = completion.choices[0]?.message.content

      if (!content) {
        throw new Error("Failed to get OpenAI response")
      }

      const parsed = ActivityGroupSummarySchema.parse(JSON.parse(content))

      return {
        summaries: parsed.summaries,
      }
    } catch (error) {
      console.error(
        `Summarization failed for ${input.dataSourceName} (${input.activityType}):`,
        error,
      )

      // フォールバック: 元のタイトルを返す
      return {
        summaries: input.activities.map((a) => ({
          activityId: a.activityId,
          title: a.title,
          summary: DEFAULT_FALLBACK_SUMMARY,
        })),
      }
    }
  }

  /**
   * システムプロンプトを構築
   */
  private buildSystemPrompt(language: string): string {
    return `あなたはソフトウェア開発のアクティビティを要約する専門家です。
与えられた複数のアクティビティについて、各アクティビティのタイトルを${language}に翻訳し、内容を簡潔に要約してください。

要約の指針:
- タイトルは簡潔で分かりやすく翻訳してください
- 要約は100文字程度で、変更の内容や影響を簡潔に説明してください
- 技術用語は適切に${language}化してください
- 必ず与えられた全てのアクティビティについて要約を返してください`
  }

  /**
   * ユーザープロンプトを構築
   */
  private buildUserPrompt(input: SummarizeActivityGroupInput): string {
    const activityList = input.activities
      .map((a, index) => {
        return `
## アクティビティ ${index + 1}
- ID: ${a.activityId}
- タイトル: ${a.title}
- 本文:
${a.body.substring(0, 500)}...
`
      })
      .join("\n")

    return `データソース: ${input.dataSourceName}
アクティビティ種別: ${input.activityType}

以下のアクティビティについて、各アクティビティのタイトルを${input.language}に翻訳し、要約を生成してください:

${activityList}

必ず${input.activities.length}件全てのアクティビティについて、IDを含めて要約を返してください。`
  }
}
