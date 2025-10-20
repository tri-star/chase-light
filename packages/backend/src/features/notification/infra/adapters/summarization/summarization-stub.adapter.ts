/**
 * Summarization Stub Adapter
 * テスト用のスタブ実装
 */

import type {
  SummarizationPort,
  SummarizeActivityGroupInput,
  SummarizeActivityGroupOutput,
} from "../../../application/ports/summarization.port"

export class SummarizationStubAdapter implements SummarizationPort {
  async summarizeActivityGroup(
    input: SummarizeActivityGroupInput,
  ): Promise<SummarizeActivityGroupOutput> {
    // テスト用に決定的な出力を返す
    const summaries = input.activities.map((activity) => ({
      activityId: activity.activityId,
      title: `[日本語] ${activity.title}`,
      summary: `[${input.dataSourceName}] の ${input.activityType} に関する要約: ${activity.title.substring(0, 50)}...`,
    }))

    return { summaries }
  }
}
