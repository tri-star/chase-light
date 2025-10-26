import OpenAI from "openai"
import { type ActivityType } from "../../../domain/activity"
import {
  SUMMARIZATION_PROMPTS,
  SummarizationOptions,
  SummarizationPort,
  SummarizationResponse,
} from "../../../application/ports/summarization.port"

export class SummarizationAdapter implements SummarizationPort {
  private openai: OpenAI
  private defaultOptions: SummarizationOptions = {
    model: "gpt-4o-mini",
    maxTokens: 500,
  }

  constructor(apiKey: string, options: SummarizationOptions = {}) {
    this.openai = new OpenAI({
      apiKey,
    })
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  async summarize(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<SummarizationResponse> {
    try {
      // セキュリティ対策: プロンプトインジェクション防止のためのテキスト前処理
      const sanitizedTitle = this.sanitizeInput(title)
      const sanitizedBody = this.sanitizeInput(body)

      const systemPrompt = SUMMARIZATION_PROMPTS[activityType]
      const userContent = `<user-input>\nTitle: ${sanitizedTitle}\nBody: ${sanitizedBody}\n</user-input>`

      const response = await this.openai.chat.completions.create({
        model: this.defaultOptions.model!,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "summarization_result",
            schema: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "要約された内容",
                },
              },
              required: ["summary"],
              additionalProperties: false,
            },
          },
        },
        max_tokens: this.defaultOptions.maxTokens,
        temperature: 0.3, // 一貫性のある要約のため低めに設定
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("OpenAI API returned empty response")
      }

      const result = JSON.parse(content) as SummarizationResponse

      // レスポンス検証
      if (!result.summary) {
        throw new Error("Invalid summarization response format")
      }

      return result
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error("OpenAI API rate limit exceeded")
        }
        if (error.status === 400) {
          throw new Error("Invalid summarization request")
        }
        if (error.status === 401) {
          throw new Error("OpenAI API authentication failed")
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      if (error instanceof SyntaxError) {
        throw new Error("Failed to parse OpenAI API response")
      }

      if (error instanceof Error) {
        throw new Error(`Summarization service error: ${error.message}`)
      }

      throw new Error("Summarization service error: Unknown error")
    }
  }

  /**
   * プロンプトインジェクション対策のための入力テキストサニタイズ
   * <user-input>、</user-input> タグを削除して悪意のあるプロンプト注入を防ぐ
   */
  private sanitizeInput(text: string): string {
    return text
      .replace(/<user-input>/gi, "")
      .replace(/<\/user-input>/gi, "")
      .trim()
  }
}

/**
 * SummarizationServiceのファクトリー関数
 * テスト時にスタブインスタンスを差し替えやすくするため
 */
export function createSummarizationService(
  apiKey: string,
  options: SummarizationOptions = {},
): SummarizationAdapter {
  return new SummarizationAdapter(apiKey, options)
}
