import OpenAI from "openai"
import type {
  BodyTranslationPort,
  BodyTranslationOptions,
} from "../../../application/ports/body-translation.port"
import type { ActivityBodyTranslationTargetLanguage } from "../../../domain"

export class BodyTranslationAdapter implements BodyTranslationPort {
  private readonly openai: OpenAI
  private readonly defaultOptions: BodyTranslationOptions = {
    model: "gpt-4o-mini",
    maxTokens: 4000,
  }

  constructor(apiKey: string, options: BodyTranslationOptions = {}) {
    this.openai = new OpenAI({
      apiKey,
    })
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  async translate(
    body: string,
    targetLanguage: ActivityBodyTranslationTargetLanguage = "ja",
  ) {
    const sanitizedBody = this.sanitize(body)
    const response = await this.openai.chat.completions.create({
      model: this.defaultOptions.model!,
      messages: [
        {
          role: "system",
          content: `Translate the following text into ${targetLanguage}. Return JSON with a single field "translatedBody". Keep code blocks and URLs intact.`,
        },
        {
          role: "user",
          content: sanitizedBody,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "body_translation_result",
          schema: {
            type: "object",
            properties: {
              translatedBody: {
                type: "string",
              },
            },
            required: ["translatedBody"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: this.defaultOptions.maxTokens,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("OpenAI returned empty response")
    }

    const parsed = JSON.parse(content) as { translatedBody: string }
    return { translatedBody: this.normalize(parsed.translatedBody) }
  }

  private sanitize(input: string): string {
    return input.replace(/<user-input>/gi, "").replace(/<\/user-input>/gi, "")
  }

  private normalize(value: string): string {
    return value.trim()
  }
}
