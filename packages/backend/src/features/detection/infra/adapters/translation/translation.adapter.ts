import OpenAI from "openai"
import { type ActivityType } from "../../../domain/activity"
import {
  TRANSLATION_PROMPTS,
  TranslationOptions,
  TranslationPort,
  TranslationResponse,
} from "../../../application/ports/translation.port"

export class TranslationAdapter implements TranslationPort {
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
                summary: {
                  type: "string",
                  description: "本文の要約（日本語）",
                },
                translatedBody: {
                  type: ["string", "null"],
                  description: "翻訳された本文。今回の処理ではnullを許可",
                },
              },
              required: ["translatedTitle", "summary", "translatedBody"],
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

      const raw = JSON.parse(content) as TranslationResponse

      // レスポンス検証
      if (!raw.summary || !raw.translatedTitle) {
        throw new Error("Invalid translation response format")
      }

      return {
        translatedTitle: this.normalizeText(raw.translatedTitle),
        summary: this.normalizeText(raw.summary),
        translatedBody: raw.translatedBody
          ? this.normalizeText(raw.translatedBody)
          : null,
      }
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

  private normalizeText(value: string | null): string | null {
    if (!value) {
      return null
    }
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
  }
}

/**
 * TranslationServiceのファクトリー関数
 * テスト時にスタブインスタンスを差し替えやすくするため
 */
export function createTranslationService(
  apiKey: string,
  options: TranslationOptions = {},
): TranslationAdapter {
  return new TranslationAdapter(apiKey, options)
}
