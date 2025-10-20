import type { DigestGeneratorStats, DigestGroupId } from "../../domain"

export type SummarizationEntryInput = {
  activityId: string
  title: string
  body: string | null
  url: string | null
  occurredAt: Date
}

export type SummarizationGroupInput = {
  groupId: DigestGroupId
  dataSourceName: string
  activityType: string
  locale: string
  entries: SummarizationEntryInput[]
}

export type SummarizationEntryOutput = {
  activityId: string
  title: string
  summary: string
  url: string | null
}

export type SummarizationGroupOutput = {
  groupId: DigestGroupId
  entries: SummarizationEntryOutput[]
  generator: DigestGeneratorStats
}

export interface SummarizationPort {
  summarizeGroups(
    inputs: SummarizationGroupInput[],
  ): Promise<SummarizationGroupOutput[]>
}
