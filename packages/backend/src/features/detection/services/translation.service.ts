import OpenAI from "openai"
import { ACTIVITY_TYPE, type ActivityType } from "../domain/activity"

interface TranslationResponse {
  translatedTitle: string
  translatedBody: string
}

interface TranslationOptions {
  model?: string
  maxTokens?: number
}

const TRANSLATION_PROMPTS = {
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

export class TranslationService {
  private openai: OpenAI
  private defaultOptions: TranslationOptions = {
    model: "gpt-4o-mini",
    maxTokens: 4000,
  }

  constructor(apiKey: string, options: TranslationOptions = {}) {
    this.openai = new OpenAI({
      apiKey,
    })
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  async translate(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<TranslationResponse> {
    try {
      // セキュリティ対策: プロンプトインジェクション防止のためのテキスト前処理
      const sanitizedTitle = this.sanitizeInput(title)
      const sanitizedBody = this.sanitizeInput(body)

      const systemPrompt = TRANSLATION_PROMPTS[activityType]
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
            name: "translation_result",
            schema: {
              type: "object",
              properties: {
                translatedTitle: {
                  type: "string",
                  description: "翻訳されたタイトル",
                },
                translatedBody: {
                  type: "string",
                  description: "翻訳された本文",
                },
              },
              required: ["translatedTitle", "translatedBody"],
              additionalProperties: false,
            },
          },
        },
        max_tokens: this.defaultOptions.maxTokens,
        temperature: 0.3, // 一貫性のある翻訳のため低めに設定
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("OpenAI API returned empty response")
      }

      const result = JSON.parse(content) as TranslationResponse

      // レスポンス検証
      if (!result.translatedTitle || !result.translatedBody) {
        throw new Error("Invalid translation response format")
      }

      return result
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error("OpenAI API rate limit exceeded")
        }
        if (error.status === 400) {
          throw new Error("Invalid translation request")
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
        throw new Error(`Translation service error: ${error.message}`)
      }

      throw new Error("Translation service error: Unknown error")
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
 * TranslationServiceのファクトリー関数
 * テスト時にスタブインスタンスを差し替えやすくするため
 */
export function createTranslationService(
  apiKey: string,
  options: TranslationOptions = {},
): TranslationService {
  return new TranslationService(apiKey, options)
}
