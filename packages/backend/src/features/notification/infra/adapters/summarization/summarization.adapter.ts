import OpenAI from "openai"
import {
  DIGEST_GENERATOR_TYPE,
  type DigestGeneratorStats,
} from "../../../domain"
import type {
  SummarizationGroupInput,
  SummarizationGroupOutput,
  SummarizationPort,
} from "../../../application/ports/summarization.port"

export type SummarizationAdapterOptions = {
  model?: string
  maxTokens?: number
  temperature?: number
}

type SummarizationResponse = {
  entries: Array<{
    activityId: string
    title: string
    summary: string
  }>
}

export class SummarizationAdapter implements SummarizationPort {
  private openai: OpenAI
  private options: Required<SummarizationAdapterOptions>

  constructor(apiKey: string, options: SummarizationAdapterOptions = {}) {
    this.openai = new OpenAI({ apiKey })
    this.options = {
      model: options.model ?? "gpt-4o-mini",
      maxTokens: options.maxTokens ?? 1200,
      temperature: options.temperature ?? 0.2,
    }
  }

  async summarizeGroups(
    inputs: SummarizationGroupInput[],
  ): Promise<SummarizationGroupOutput[]> {
    const results: SummarizationGroupOutput[] = []

    for (const input of inputs) {
      try {
        const result = await this.summarizeGroup(input)
        results.push(result)
      } catch (_error) {
        results.push(this.buildFallbackOutput(input))
      }
    }

    return results
  }

  private async summarizeGroup(
    input: SummarizationGroupInput,
  ): Promise<SummarizationGroupOutput> {
    const systemPrompt =
      "You are an assistant that summarizes GitHub repository updates into concise Japanese bullet points." +
      " Respond using JSON that strictly follows the provided schema." +
      " Keep summaries short (max 120 characters) and highlight the key change." +
      " Avoid markdown or HTML markup."

    const userContent = this.formatUserContent(input)

    const response = await this.openai.chat.completions.create({
      model: this.options.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "digest_group_summary",
          schema: {
            type: "object",
            properties: {
              entries: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  properties: {
                    activityId: { type: "string" },
                    title: { type: "string" },
                    summary: { type: "string" },
                  },
                  required: ["activityId", "title", "summary"],
                  additionalProperties: false,
                },
              },
            },
            required: ["entries"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: this.options.maxTokens,
      temperature: this.options.temperature,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("Summarization response was empty")
    }

    const parsed = this.parseResponse(content)
    const generatorStats = this.buildGeneratorStats(
      input.groupId,
      response.usage,
    )

    const entries = parsed.entries.map((entry) => {
      const original = input.entries.find(
        (candidate) => candidate.activityId === entry.activityId,
      )

      return {
        activityId: entry.activityId,
        title: entry.title,
        summary: entry.summary,
        url: original?.url ?? null,
      }
    })

    if (entries.length === 0) {
      throw new Error("Summarization response did not contain entries")
    }

    return {
      groupId: input.groupId,
      entries,
      generator: generatorStats,
    }
  }

  private parseResponse(content: string): SummarizationResponse {
    const parsed = JSON.parse(content) as SummarizationResponse

    if (!Array.isArray(parsed.entries)) {
      throw new Error("Summarization response format mismatch")
    }

    return parsed
  }

  private buildGeneratorStats(
    groupId: string,
    usage: OpenAI.Chat.Completions.ChatCompletion["usage"],
  ): DigestGeneratorStats {
    return {
      groupId,
      type: DIGEST_GENERATOR_TYPE.AI,
      model: this.options.model,
      promptTokens: usage?.prompt_tokens ?? undefined,
      completionTokens: usage?.completion_tokens ?? undefined,
      totalTokens: usage?.total_tokens ?? undefined,
    }
  }

  private buildFallbackOutput(
    input: SummarizationGroupInput,
  ): SummarizationGroupOutput {
    return {
      groupId: input.groupId,
      entries: input.entries.map((entry) => ({
        activityId: entry.activityId,
        title: entry.title,
        summary: `${input.dataSourceName} の${input.activityType}更新: ${entry.title}`,
        url: entry.url,
      })),
      generator: {
        groupId: input.groupId,
        type: DIGEST_GENERATOR_TYPE.FALLBACK,
      },
    }
  }

  private formatUserContent(input: SummarizationGroupInput): string {
    const lines = input.entries.map((entry, index) => {
      const sanitizedTitle = this.sanitize(entry.title)
      const sanitizedBody = this.sanitize(entry.body)
      const occurredAt = entry.occurredAt.toISOString()

      return (
        `### エントリ${index + 1}\n` +
        `activityId: ${entry.activityId}\n` +
        `title: ${sanitizedTitle}\n` +
        `occurredAt: ${occurredAt}\n` +
        `body: ${sanitizedBody}`
      )
    })

    return [
      `データソース: ${this.sanitize(input.dataSourceName)}`,
      `アクティビティ種別: ${input.activityType}`,
      `出力言語: 日本語 (${input.locale})`,
      `要約対象:`,
      ...lines,
    ].join("\n\n")
  }

  private sanitize(value: string | null): string {
    if (!value) {
      return ""
    }

    const withoutTags = value.replace(/<\/?user-input>/gi, "")
    let cleaned = ""

    for (const char of withoutTags) {
      const code = char.charCodeAt(0)
      cleaned += code <= 0x1f || code === 0x7f ? " " : char
    }

    return cleaned.trim().slice(0, 2000)
  }
}

export function createSummarizationAdapter(
  apiKey: string,
  options: SummarizationAdapterOptions = {},
): SummarizationAdapter {
  return new SummarizationAdapter(apiKey, options)
}
