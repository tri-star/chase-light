import {
  DEFAULT_DIGEST_NOTIFICATION_FETCH_LIMIT,
  DIGEST_MAX_ENTRIES_PER_GROUP,
  DIGEST_MAX_LOOKBACK_DAYS,
} from "shared"
import {
  DIGEST_GENERATOR_TYPE,
  DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  buildDigestMetadata,
  calculateDigestWindow,
  createFallbackGroupResult,
  type DigestCandidate,
  type DigestGroupResult,
  type DigestNotificationDraft,
} from "../../domain"
import type {
  DigestPreparationRepository,
  FindDigestCandidatesParams,
} from "../../domain/repositories/notification-preparation.repository"
import type { DigestNotificationRepository } from "../../domain/repositories/digest-notification.repository"
import type {
  DigestUserState,
  DigestUserStateRepository,
  UpdateDigestUserStateInput,
} from "../../domain/repositories/digest-user-state.repository"
import type {
  SummarizationGroupInput,
  SummarizationGroupOutput,
  SummarizationPort,
} from "../ports/summarization.port"

export type GenerateDigestNotificationsInput = {
  limit?: number
  dryRun?: boolean
  since?: Date
  until?: Date
}

export type DigestWindowSummary = {
  userId: string
  from: string
  to: string
  activityCount: number
  fallbackGroups: number
  notificationCreated: boolean
}

export type GenerateDigestNotificationsResult = {
  created: number
  skippedByConflict: number
  totalExamined: number
  processedUsers: number
  windowSummaries: DigestWindowSummary[]
}

const DEFAULT_LOCALE = "ja-JP"

export class GenerateDigestNotificationsUseCase {
  constructor(
    private readonly digestPreparationRepository: DigestPreparationRepository,
    private readonly digestNotificationRepository: DigestNotificationRepository,
    private readonly digestUserStateRepository: DigestUserStateRepository,
    private readonly summarizationPort: SummarizationPort,
    private readonly now: () => Date = () => new Date(),
    private readonly maxEntriesPerGroup: number = DIGEST_MAX_ENTRIES_PER_GROUP,
    private readonly lookbackDays: number = DIGEST_MAX_LOOKBACK_DAYS,
  ) {}

  async execute(
    input: GenerateDigestNotificationsInput = {},
  ): Promise<GenerateDigestNotificationsResult> {
    const limit = input.limit ?? DEFAULT_DIGEST_NOTIFICATION_FETCH_LIMIT
    const executedAt = this.now()

    const userStates = await this.digestUserStateRepository.fetchUserStates({
      limit,
    })

    if (userStates.length === 0) {
      return {
        created: 0,
        skippedByConflict: 0,
        totalExamined: 0,
        processedUsers: 0,
        windowSummaries: [],
      }
    }

    const userWindows = this.buildUserWindows(userStates, {
      now: executedAt,
      since: input.since,
      until: input.until,
    })

    if (userWindows.length === 0) {
      return {
        created: 0,
        skippedByConflict: 0,
        totalExamined: 0,
        processedUsers: 0,
        windowSummaries: [],
      }
    }

    const candidates = await this.digestPreparationRepository.findCandidates({
      userWindows,
      maxEntriesPerGroup: this.maxEntriesPerGroup,
    })

    if (candidates.length === 0) {
      return {
        created: 0,
        skippedByConflict: 0,
        totalExamined: 0,
        processedUsers: 0,
        windowSummaries: [],
      }
    }

    const drafts: DigestNotificationDraft[] = []
    const windowSummaries: DigestWindowSummary[] = []
    const updates: UpdateDigestUserStateInput[] = []

    let totalExamined = 0

    for (const candidate of candidates) {
      totalExamined += candidate.totalActivities

      const { groupResults, fallbackGroups } =
        await this.buildGroupResults(candidate)

      const notificationCreated =
        candidate.totalActivities > 0 && groupResults.length > 0

      windowSummaries.push({
        userId: candidate.userId,
        from: candidate.window.from.toISOString(),
        to: candidate.window.to.toISOString(),
        activityCount: candidate.totalActivities,
        fallbackGroups,
        notificationCreated,
      })

      updates.push({
        userId: candidate.userId,
        lastSuccessfulRunAt: candidate.window.to,
        lastAttemptedRunAt: executedAt,
      })

      if (!notificationCreated) {
        continue
      }

      const metadata = buildDigestMetadata({
        window: candidate.window,
        groups: groupResults,
        activityCount: candidate.totalActivities,
      })

      drafts.push({
        notification: {
          userId: candidate.userId,
          title: "ダイジェスト通知",
          message: DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER,
          notificationType: NOTIFICATION_TYPE.ACTIVITY_DIGEST,
          scheduledAt: executedAt,
          status: NOTIFICATION_STATUS.PENDING,
          statusDetail: null,
          metadata: {
            digest: metadata,
          },
          activityId: null,
        },
        entries: this.buildDigestEntries(groupResults),
      })
    }

    let created = 0
    let skippedByConflict = 0

    if (!input.dryRun && drafts.length > 0) {
      const result = await this.digestNotificationRepository.createMany(drafts)
      created = result.created
      skippedByConflict = result.skippedByConflict
    }

    if (!input.dryRun && updates.length > 0) {
      await this.digestUserStateRepository.updateUserStates(updates)
    }

    return {
      created,
      skippedByConflict,
      totalExamined,
      processedUsers: candidates.length,
      windowSummaries,
    }
  }

  private buildUserWindows(
    userStates: DigestUserState[],
    params: { now: Date; since?: Date; until?: Date },
  ): FindDigestCandidatesParams["userWindows"] {
    const windows: FindDigestCandidatesParams["userWindows"] = []

    for (const state of userStates) {
      const window = calculateDigestWindow({
        lastSuccessfulRunAt: state.lastSuccessfulRunAt,
        now: params.now,
        lookbackDays: this.lookbackDays,
        since: params.since,
        until: params.until,
        timezone: state.timezone,
      })

      if (!window) {
        continue
      }

      windows.push({
        userId: state.userId,
        window,
      })
    }

    return windows
  }

  private async buildGroupResults(candidate: DigestCandidate): Promise<{
    groupResults: DigestGroupResult[]
    fallbackGroups: number
  }> {
    if (candidate.groups.length === 0) {
      return { groupResults: [], fallbackGroups: 0 }
    }

    const summarizationInputs = this.buildSummarizationInputs(candidate.groups)

    let outputs: SummarizationGroupOutput[] = []
    try {
      outputs =
        await this.summarizationPort.summarizeGroups(summarizationInputs)
    } catch (_error) {
      outputs = []
    }

    const outputMap = new Map(outputs.map((output) => [output.groupId, output]))
    const groupResults: DigestGroupResult[] = []
    let fallbackGroups = 0

    for (const group of candidate.groups) {
      const output = outputMap.get(group.id)
      if (!output || output.entries.length === 0) {
        groupResults.push(createFallbackGroupResult(group))
        fallbackGroups += 1
        continue
      }

      const entries = output.entries.map((entry, index) => {
        const original = group.entries.find(
          (item) => item.activityId === entry.activityId,
        )

        return {
          activityId: entry.activityId,
          position: index,
          title: entry.title,
          summary: entry.summary,
          url: entry.url ?? original?.url ?? null,
          generator: output.generator.type,
        }
      })

      if (output.generator.type === DIGEST_GENERATOR_TYPE.FALLBACK) {
        fallbackGroups += 1
      }

      groupResults.push({
        id: group.id,
        dataSourceId: group.dataSourceId,
        dataSourceName: group.dataSourceName,
        activityType: group.activityType,
        entries,
        generator: output.generator,
      })
    }

    return { groupResults, fallbackGroups }
  }

  private buildSummarizationInputs(
    groups: DigestCandidate["groups"],
  ): SummarizationGroupInput[] {
    return groups.map((group) => ({
      groupId: group.id,
      dataSourceName: group.dataSourceName,
      activityType: group.activityType,
      locale: DEFAULT_LOCALE,
      entries: group.entries.map((entry) => ({
        activityId: entry.activityId,
        title: entry.title,
        body: entry.body,
        url: entry.url,
        occurredAt: entry.occurredAt,
      })),
    }))
  }

  private buildDigestEntries(
    groups: DigestGroupResult[],
  ): DigestNotificationDraft["entries"] {
    return groups.flatMap((group) =>
      group.entries.map((entry) => ({
        dataSourceId: group.dataSourceId,
        dataSourceName: group.dataSourceName,
        activityType: group.activityType,
        activityId: entry.activityId,
        position: entry.position,
        title: entry.title,
        summary: entry.summary,
        url: entry.url,
        generator: entry.generator,
      })),
    )
  }
}
