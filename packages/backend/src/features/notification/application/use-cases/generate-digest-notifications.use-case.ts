import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  type NotificationDraft,
} from "../../domain"
import type { NotificationPreparationRepository } from "../../domain/repositories/notification-preparation.repository"
import type { NotificationRepository } from "../../domain/repositories/notification.repository"
import type { SummarizationPort } from "../ports/summarization.port"
import {
  MAX_ACTIVITIES_PER_DATA_SOURCE_AND_TYPE,
  MAX_SUMMARY_TOKENS,
  DEFAULT_FALLBACK_SUMMARY,
} from "../../constants/notification.constants"
import type {
  DigestActivitySummary,
  DataSourceGroup,
  ActivityGroup,
  DigestActivity,
} from "../../domain/digest-activity-summary"

/**
 * ユーザー単位のダイジェスト通知生成の入力パラメータ
 */
export type GenerateDigestNotificationsForUserInput = {
  userId: string
  timeRange: {
    from: Date
    to: Date
  }
  dryRun?: boolean
}

/**
 * ユーザー単位のダイジェスト通知生成の結果
 */
export type GenerateDigestNotificationsForUserResult = {
  userId: string
  created: number
  totalActivities: number
  dataSources: Array<{
    dataSourceId: string
    dataSourceName: string
    activityCount: number
  }>
}

export class GenerateDigestNotificationsUseCase {
  constructor(
    private readonly notificationPreparationRepository: NotificationPreparationRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly summarizationPort: SummarizationPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * ユーザー単位でダイジェスト通知を生成
   */
  async executeForUser(
    input: GenerateDigestNotificationsForUserInput,
  ): Promise<GenerateDigestNotificationsForUserResult> {
    // 1. ユーザーのアクティビティを取得
    const activities =
      await this.notificationPreparationRepository.findActivitiesForDigest({
        userId: input.userId,
        timeRange: input.timeRange,
        maxActivitiesPerDataSourceAndType:
          MAX_ACTIVITIES_PER_DATA_SOURCE_AND_TYPE,
      })

    if (activities.length === 0) {
      return {
        userId: input.userId,
        created: 0,
        totalActivities: 0,
        dataSources: [],
      }
    }

    // 2. データソース＋種別ごとにグルーピング
    const groupedActivities =
      this.groupActivitiesByDataSourceAndType(activities)

    // 3. 各グループに対してAI要約をバッチ呼び出し
    const digestDataSources: DataSourceGroup[] = []
    for (const [dataSourceId, dataSourceGroup] of groupedActivities) {
      const activityGroups: ActivityGroup[] = []

      for (const [activityType, groupActivities] of dataSourceGroup.types) {
        const summarizedActivities = await this.summarizeActivityGroup(
          dataSourceGroup.name,
          activityType,
          groupActivities,
        )

        activityGroups.push({
          type: activityType,
          activities: summarizedActivities,
        })
      }

      digestDataSources.push({
        dataSourceId,
        dataSourceName: dataSourceGroup.name,
        activityGroups,
      })
    }

    // 4. 構造化されたmetadataを作成
    const digestSummary: DigestActivitySummary = {
      range: {
        from: input.timeRange.from.toISOString(),
        to: input.timeRange.to.toISOString(),
      },
      language: "ja",
      dataSources: digestDataSources,
    }

    // 5. 全アクティビティIDを収集
    const allActivityIds = activities.map((a) => a.activityId)

    // 6. 通知を作成
    const draft: NotificationDraft = {
      userId: input.userId,
      activityId: undefined, // ダイジェスト通知ではnull
      title: "ダイジェスト通知",
      message: this.generateDigestMessage(digestDataSources),
      notificationType: NOTIFICATION_TYPE.ACTIVITY_DIGEST,
      scheduledAt: this.now(),
      status: NOTIFICATION_STATUS.PENDING,
      statusDetail: null,
      metadata: {
        scheduledSlot: "digest",
        digestTimezone: "Asia/Tokyo",
        digest: digestSummary,
      },
      activityIds: allActivityIds,
    }

    if (input.dryRun) {
      return {
        userId: input.userId,
        created: 0,
        totalActivities: activities.length,
        dataSources: this.summarizeDataSources(groupedActivities),
      }
    }

    const result = await this.notificationRepository.createMany([draft])

    return {
      userId: input.userId,
      created: result.created,
      totalActivities: activities.length,
      dataSources: this.summarizeDataSources(groupedActivities),
    }
  }

  /**
   * アクティビティをデータソース＋種別ごとにグルーピング
   */
  private groupActivitiesByDataSourceAndType(
    activities: Array<{
      activityId: string
      dataSourceId: string
      dataSourceName: string
      activityType: string
      title: string
      body: string
      url: string
      createdAt: Date
    }>,
  ): Map<
    string,
    {
      name: string
      types: Map<
        string,
        Array<{
          activityId: string
          title: string
          body: string
          url: string
        }>
      >
    }
  > {
    const grouped = new Map<
      string,
      {
        name: string
        types: Map<
          string,
          Array<{
            activityId: string
            title: string
            body: string
            url: string
          }>
        >
      }
    >()

    for (const activity of activities) {
      let dataSourceGroup = grouped.get(activity.dataSourceId)
      if (!dataSourceGroup) {
        dataSourceGroup = {
          name: activity.dataSourceName,
          types: new Map(),
        }
        grouped.set(activity.dataSourceId, dataSourceGroup)
      }

      let typeGroup = dataSourceGroup.types.get(activity.activityType)
      if (!typeGroup) {
        typeGroup = []
        dataSourceGroup.types.set(activity.activityType, typeGroup)
      }

      typeGroup.push({
        activityId: activity.activityId,
        title: activity.title,
        body: activity.body,
        url: activity.url,
      })
    }

    return grouped
  }

  /**
   * アクティビティグループをAI要約
   */
  private async summarizeActivityGroup(
    dataSourceName: string,
    activityType: string,
    activities: Array<{
      activityId: string
      title: string
      body: string
      url: string
    }>,
  ): Promise<DigestActivity[]> {
    try {
      const result = await this.summarizationPort.summarizeActivityGroup({
        dataSourceName,
        activityType,
        activities,
        language: "ja",
        maxTokens: MAX_SUMMARY_TOKENS,
      })

      return result.summaries.map((s) => ({
        activityId: s.activityId,
        title: s.title,
        summary: s.summary,
        url: activities.find((a) => a.activityId === s.activityId)?.url ?? "",
      }))
    } catch (error) {
      // AI要約が失敗した場合、フォールバック処理
      console.error(`AI要約失敗 (${dataSourceName}, ${activityType}):`, error)
      return activities.map((a) => ({
        activityId: a.activityId,
        title: a.title,
        summary: DEFAULT_FALLBACK_SUMMARY,
        url: a.url,
      }))
    }
  }

  /**
   * ダイジェストメッセージを生成
   */
  private generateDigestMessage(dataSources: DataSourceGroup[]): string {
    const totalCount = dataSources.reduce(
      (sum, ds) =>
        sum + ds.activityGroups.reduce((s, ag) => s + ag.activities.length, 0),
      0,
    )

    return `${totalCount}件の更新があります`
  }

  /**
   * データソースの要約情報を作成
   */
  private summarizeDataSources(
    groupedActivities: Map<
      string,
      {
        name: string
        types: Map<string, Array<unknown>>
      }
    >,
  ): Array<{
    dataSourceId: string
    dataSourceName: string
    activityCount: number
  }> {
    return Array.from(groupedActivities.entries()).map(
      ([dataSourceId, group]) => {
        const activityCount = Array.from(group.types.values()).reduce(
          (sum, activities) => sum + activities.length,
          0,
        )
        return {
          dataSourceId,
          dataSourceName: group.name,
          activityCount,
        }
      },
    )
  }
}
