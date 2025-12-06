import OpenAI from "openai"
import type { ActivityType } from "../../../domain"
import type {
  ActivityBodyTranslationPort,
  ActivityBodyTranslationResult,
} from "../../../application/ports/activity-body-translation.port"

const BODY_TRANSLATION_PROMPTS: Record<ActivityType, string> = {
  release: `以下の<user-input>タグ内のリリースノートについて、JSONで回答してください。
- translatedTitle: 日本語に翻訳したタイトル。
- summary: 本文の要点を2〜3文で日本語要約（箇条書き不可）。
- translatedBody: 本文を日本語翻訳した全文。
技術的な内容を正確に、開発者が理解しやすい表現で翻訳してください。
バージョン番号や固有名詞は保持し、変更内容・影響範囲が明確になるようにしてください。`,
  issue: `以下の<user-input>タグ内のIssue内容について、JSONで回答してください。
- translatedTitle: 日本語に翻訳したタイトル。
- summary: 本文の要点を2〜3文で日本語要約（箇条書き不可）。
- translatedBody: 本文を日本語翻訳した全文。
問題の背景と解決策が分かるように翻訳し、再現手順などの技術的詳細も正確に伝えてください。`,
  pull_request: `以下の<user-input>タグ内のPR内容について、JSONで回答してください。
- translatedTitle: 日本語に翻訳したタイトル。
- summary: 本文の要点を2〜3文で日本語要約（箇条書き不可）。
- translatedBody: 本文を日本語翻訳した全文。
変更点や影響範囲を明確にし、レビュアーが理解しやすい日本語で翻訳してください。`,
}

export type TranslationAdapterOptions = {
  model?: string
  maxTokens?: number
}

export class ActivityBodyTranslationAdapter
  implements ActivityBodyTranslationPort
{
  private openai: OpenAI
  private defaultOptions: TranslationAdapterOptions = {
    model: "gpt-4o-mini",
    maxTokens: 6000,
  }

  constructor(apiKey: string, options: TranslationAdapterOptions = {}) {
    this.openai = new OpenAI({ apiKey })
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  async translateBody(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<ActivityBodyTranslationResult> {
    const sanitizedTitle = this.sanitizeInput(title)
    const sanitizedBody = this.sanitizeInput(body)
    const systemPrompt = BODY_TRANSLATION_PROMPTS[activityType]

    const userContent = `<user-input>\nTitle: ${sanitizedTitle}\nBody: ${sanitizedBody}\n</user-input>`

    const response = await this.openai.chat.completions.create({
      model: this.defaultOptions.model!,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation_result",
          schema: {
            type: "object",
            properties: {
              translatedTitle: { type: "string" },
              summary: { type: "string" },
              translatedBody: { type: "string" },
            },
            required: ["translatedTitle", "summary", "translatedBody"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: this.defaultOptions.maxTokens,
      temperature: 0.2,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("OpenAI API returned empty response")
    }

    const parsed = JSON.parse(content) as ActivityBodyTranslationResult
    return {
      translatedTitle: this.normalizeText(parsed.translatedTitle),
      summary: this.normalizeText(parsed.summary),
      translatedBody: this.normalizeText(parsed.translatedBody),
    }
  }

  private sanitizeInput(text: string): string {
    return text
      .replace(/<user-input>/gi, "")
      .replace(/<\/user-input>/gi, "")
      .trim()
  }

  private normalizeText(value: string | null | undefined): string | null {
    if (!value) {
      return null
    }
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
  }
}
