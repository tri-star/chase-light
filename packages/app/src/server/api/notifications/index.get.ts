import {
  notificationSchema,
  type NotificationSearchResult,
} from '~/features/notification/domain/notification'
import { createSsrApiClient } from '~/lib/api/client'

export default defineEventHandler(
  async (event): Promise<NotificationSearchResult> => {
    const apiClient = await createSsrApiClient(event)

    const data = await apiClient.getNotifications()

    const notifications = data.result.map((notification) =>
      notificationSchema.parse(notification),
    )

    return {
      result: notifications,
      total: data.total,
    }
  },
)
