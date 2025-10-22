import { DIGEST_GENERATOR_TYPE } from "../../../domain/digest"
import type {
  SummarizationGroupInput,
  SummarizationGroupOutput,
  SummarizationPort,
} from "../../../application/ports/summarization.port"

export type StubSummarizationAdapterOptions = {
  skipGroupIds?: string[]
  fallbackGroupIds?: string[]
  failureGroupIds?: string[]
}

export class StubSummarizationAdapter implements SummarizationPort {
  private skipGroupIds: Set<string>
  private fallbackGroupIds: Set<string>
  private failureGroupIds: Set<string>

  constructor(options: StubSummarizationAdapterOptions = {}) {
    this.skipGroupIds = new Set(options.skipGroupIds ?? [])
    this.fallbackGroupIds = new Set(options.fallbackGroupIds ?? [])
    this.failureGroupIds = new Set(options.failureGroupIds ?? [])
  }

  configure(options: StubSummarizationAdapterOptions): void {
    if (options.skipGroupIds !== undefined) {
      this.skipGroupIds = new Set(options.skipGroupIds)
    }
    if (options.fallbackGroupIds !== undefined) {
      this.fallbackGroupIds = new Set(options.fallbackGroupIds)
    }
    if (options.failureGroupIds !== undefined) {
      this.failureGroupIds = new Set(options.failureGroupIds)
    }
  }

  reset(): void {
    this.skipGroupIds.clear()
    this.fallbackGroupIds.clear()
    this.failureGroupIds.clear()
  }

  async summarizeGroups(
    inputs: SummarizationGroupInput[],
  ): Promise<SummarizationGroupOutput[]> {
    const outputs: SummarizationGroupOutput[] = []

    for (const input of inputs) {
      if (this.skipGroupIds.has(input.groupId)) {
        continue
      }

      if (this.failureGroupIds.has(input.groupId)) {
        throw new Error(
          `Summarization failure simulated for group ${input.groupId}`,
        )
      }

      const isFallback = this.fallbackGroupIds.has(input.groupId)
      outputs.push({
        groupId: input.groupId,
        entries: input.entries.map((entry) => ({
          activityId: entry.activityId,
          title: entry.title,
          summary: isFallback
            ? `${input.dataSourceName} の ${input.activityType} 更新: ${entry.title}`
            : `${entry.title} (stub要約)`,
          url: entry.url,
        })),
        generator: {
          groupId: input.groupId,
          type: isFallback
            ? DIGEST_GENERATOR_TYPE.FALLBACK
            : DIGEST_GENERATOR_TYPE.AI,
        },
      })
    }

    return outputs
  }
}

export function createStubSummarizationAdapter(
  options: StubSummarizationAdapterOptions = {},
): StubSummarizationAdapter {
  return new StubSummarizationAdapter(options)
}
