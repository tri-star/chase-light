import { fakerJA } from "@faker-js/faker"
import { DIGEST_GENERATOR_TYPE } from "../digest"
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  type DigestNotificationDraft,
} from "../notification"
import type { Activity } from "../../../activities/domain"

type DataSourceMeta = {
  name: string
  fullName?: string
}

export function createNotificationDraft(
  userId: string,
  activities: Activity[],
  dataSourcesById: Map<string, DataSourceMeta>,
): DigestNotificationDraft {
  const now = new Date()
  const scheduledAt = new Date(
    now.getTime() - fakerJA.number.int({ min: 0, max: 60 }) * 60 * 1000,
  )

  return {
    notification: {
      userId,
      title: fakerJA.lorem.sentence(),
      message: fakerJA.lorem.sentence(),
      notificationType: NOTIFICATION_TYPE.ACTIVITY_DIGEST,
      scheduledAt,
      status: NOTIFICATION_STATUS.PENDING,
      metadata: {},
    },
    entries: activities.map((activity, index) => {
      const dataSource = dataSourcesById.get(activity.dataSourceId)
      const dataSourceName = dataSource?.name ?? "unknown-repo"
      const repositoryPath = dataSource?.fullName ?? dataSourceName
      return {
        dataSourceId: activity.dataSourceId,
        dataSourceName,
        activityType: activity.activityType,
        activityId: activity.id,
        position: index + 1,
        title: fakerJA.lorem.sentence(),
        summary: fakerJA.lorem.sentence({ min: 10, max: 50 }),
        url: `https://github.com/${repositoryPath}`,
        generator: DIGEST_GENERATOR_TYPE.FACTORY,
      }
    }),
  }
}
