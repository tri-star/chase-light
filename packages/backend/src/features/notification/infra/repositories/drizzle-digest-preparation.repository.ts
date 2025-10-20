import { and, desc, eq, gte, lt, or } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { activities, dataSources, userWatches } from "../../../../db/schema"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../activities/domain"
import {
  createDigestGroupId,
  type DigestCandidate,
  type DigestEntryCandidate,
  type DigestGroupCandidate,
} from "../../domain"
import type {
  DigestPreparationRepository,
  FindDigestCandidatesParams,
} from "../../domain/repositories/notification-preparation.repository"

type ActivityRow = {
  activityId: string
  activityType: string
  activityTitle: string
  activityBody: string
  activityCreatedAt: Date
  dataSourceId: string
  dataSourceName: string | null
  dataSourceSourceId: string
}

export class DrizzleDigestPreparationRepository
  implements DigestPreparationRepository
{
  async findCandidates(
    params: FindDigestCandidatesParams,
  ): Promise<DigestCandidate[]> {
    const connection = await TransactionManager.getConnection()
    const candidates: DigestCandidate[] = []

    for (const userWindow of params.userWindows) {
      const rows = await connection
        .select({
          activityId: activities.id,
          activityType: activities.activityType,
          activityTitle: activities.title,
          activityBody: activities.body,
          activityCreatedAt: activities.createdAt,
          dataSourceId: dataSources.id,
          dataSourceName: dataSources.name,
          dataSourceSourceId: dataSources.sourceId,
          watchReleases: userWatches.watchReleases,
          watchIssues: userWatches.watchIssues,
          watchPullRequests: userWatches.watchPullRequests,
        })
        .from(activities)
        .innerJoin(
          userWatches,
          and(
            eq(userWatches.dataSourceId, activities.dataSourceId),
            eq(userWatches.userId, userWindow.userId),
          ),
        )
        .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
        .where(
          and(
            eq(userWatches.notificationEnabled, true),
            eq(activities.status, ACTIVITY_STATUS.COMPLETED),
            gte(activities.createdAt, userWindow.window.from),
            lt(activities.createdAt, userWindow.window.to),
            this.buildWatchCondition(),
          ),
        )
        .orderBy(desc(activities.createdAt))

      const groups = this.groupActivities(rows, params.maxEntriesPerGroup)
      const activityCount = groups.reduce(
        (total, group) => total + group.entries.length,
        0,
      )

      candidates.push({
        userId: userWindow.userId,
        userTimezone: userWindow.window.timezone,
        window: userWindow.window,
        totalActivities: activityCount,
        groups,
      })
    }

    return candidates
  }

  private buildWatchCondition() {
    return or(
      and(
        eq(activities.activityType, ACTIVITY_TYPE.RELEASE),
        eq(userWatches.watchReleases, true),
      ),
      and(
        eq(activities.activityType, ACTIVITY_TYPE.ISSUE),
        eq(userWatches.watchIssues, true),
      ),
      and(
        eq(activities.activityType, ACTIVITY_TYPE.PULL_REQUEST),
        eq(userWatches.watchPullRequests, true),
      ),
    )
  }

  private groupActivities(
    rows: (ActivityRow & {
      watchReleases: boolean
      watchIssues: boolean
      watchPullRequests: boolean
    })[],
    maxEntriesPerGroup: number,
  ): DigestGroupCandidate[] {
    const groups = new Map<string, DigestGroupCandidate>()

    for (const row of rows) {
      if (!this.isActivityWatchedByUser(row)) {
        continue
      }

      const groupId = createDigestGroupId(row.dataSourceId, row.activityType)
      const existing = groups.get(groupId)

      const entry: DigestEntryCandidate = {
        activityId: row.activityId,
        activityType: row.activityType,
        occurredAt: row.activityCreatedAt,
        title: row.activityTitle,
        body: row.activityBody,
        url: null,
        dataSourceId: row.dataSourceId,
        dataSourceName: row.dataSourceName ?? row.dataSourceSourceId,
      }

      if (existing) {
        if (existing.entries.length < maxEntriesPerGroup) {
          existing.entries.push(entry)
        }
        continue
      }

      groups.set(groupId, {
        id: groupId,
        dataSourceId: row.dataSourceId,
        dataSourceName: row.dataSourceName ?? row.dataSourceSourceId,
        activityType: row.activityType,
        entries: [entry],
      })
    }

    return Array.from(groups.values())
  }

  private isActivityWatchedByUser(
    row: ActivityRow & {
      watchReleases: boolean
      watchIssues: boolean
      watchPullRequests: boolean
    },
  ): boolean {
    switch (row.activityType) {
      case ACTIVITY_TYPE.RELEASE:
        return row.watchReleases
      case ACTIVITY_TYPE.ISSUE:
        return row.watchIssues
      case ACTIVITY_TYPE.PULL_REQUEST:
        return row.watchPullRequests
      default:
        return false
    }
  }
}
