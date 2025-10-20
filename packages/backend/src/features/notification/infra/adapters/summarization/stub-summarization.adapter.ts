import { DIGEST_GENERATOR_TYPE } from "../../../domain"
import type {
  SummarizationGroupInput,
  SummarizationGroupOutput,
  SummarizationPort,
} from "../../../application/ports/summarization.port"

export type StubSummarizationAdapterOptions = {
  skipGroupIds?: string[]
  fallbackGroupIds?: string[]
}

export class StubSummarizationAdapter implements SummarizationPort {
  constructor(private readonly options: StubSummarizationAdapterOptions = {}) {}

  async summarizeGroups(
    inputs: SummarizationGroupInput[],
  ): Promise<SummarizationGroupOutput[]> {
    const outputs: SummarizationGroupOutput[] = []

    for (const input of inputs) {
      if (this.options.skipGroupIds?.includes(input.groupId)) {
        continue
      }

      const isFallback = this.options.fallbackGroupIds?.includes(input.groupId)

      outputs.push({
        groupId: input.groupId,
        entries: input.entries.map((entry) => ({
          activityId: entry.activityId,
          title: entry.title,
          summary: `${entry.title} (stub要約)`,
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
