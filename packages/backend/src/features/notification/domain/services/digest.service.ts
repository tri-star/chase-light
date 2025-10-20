import {
  DIGEST_GENERATOR_TYPE,
  DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER,
  type DigestGroupCandidate,
  type DigestGroupResult,
  type DigestWindow,
  type NotificationDigestMetadata,
} from "../digest"

const DAY_IN_MS = 24 * 60 * 60 * 1000

export type CalculateDigestWindowParams = {
  lastSuccessfulRunAt: Date | null
  now: Date
  lookbackDays: number
  since?: Date
  until?: Date
  timezone: string
}

export function calculateDigestWindow(
  params: CalculateDigestWindowParams,
): DigestWindow | null {
  const windowEnd = params.until ?? params.now
  const maxLookbackStart = new Date(
    windowEnd.getTime() - params.lookbackDays * DAY_IN_MS,
  )
  let windowStart = params.lastSuccessfulRunAt ?? maxLookbackStart
  if (windowStart < maxLookbackStart) {
    windowStart = maxLookbackStart
  }
  if (params.since && params.since > windowStart) {
    windowStart = params.since
  }
  if (windowStart >= windowEnd) {
    return null
  }
  return {
    from: windowStart,
    to: windowEnd,
    timezone: params.timezone,
  }
}

export function createFallbackGroupResult(
  group: DigestGroupCandidate,
): DigestGroupResult {
  const sortedEntries = [...group.entries].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
  )

  return {
    id: group.id,
    dataSourceId: group.dataSourceId,
    dataSourceName: group.dataSourceName,
    activityType: group.activityType,
    entries: sortedEntries.map((entry, index) => ({
      activityId: entry.activityId,
      position: index,
      title: entry.title,
      summary: `${entry.dataSourceName} の ${group.activityType} 更新: ${entry.title}`,
      url: entry.url,
      generator: DIGEST_GENERATOR_TYPE.FALLBACK,
    })),
    generator: {
      groupId: group.id,
      type: DIGEST_GENERATOR_TYPE.FALLBACK,
    },
  }
}

export type BuildDigestMetadataParams = {
  window: DigestWindow
  groups: DigestGroupResult[]
  activityCount: number
}

export function buildDigestMetadata(
  params: BuildDigestMetadataParams,
): NotificationDigestMetadata {
  return {
    range: {
      from: params.window.from.toISOString(),
      to: params.window.to.toISOString(),
      timezone: params.window.timezone,
    },
    activityCount: params.activityCount,
    groups: params.groups.map((group) => ({
      groupId: group.id,
      dataSourceId: group.dataSourceId,
      dataSourceName: group.dataSourceName,
      activityType: group.activityType,
      activityIds: group.entries.map((entry) => entry.activityId),
    })),
    generatorStats: params.groups.map((group) => group.generator),
    messagePlaceholder: DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER,
  }
}
