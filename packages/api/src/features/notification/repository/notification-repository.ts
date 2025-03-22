import type { Notification } from '@/features/notification/domain/notification'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

export class NotificationRepository {
  save(notification: Notification) {
    const prisma = getPrismaClientInstance()
    return prisma.notification.create({
      data: {
        id: notification.id,
        title: notification.title,
        read: notification.read,
        user: {
          connect: {
            id: notification.userId,
          },
        },
        notificationItems: {
          create: notification.notificationItems.map((item) => ({
            id: item.id,
            title: item.title,
            feedLogId: item.feedLogId,
          })),
        },
        createdAt: notification.createdAt,
      },
    })
  }
}
