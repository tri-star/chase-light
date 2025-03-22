import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'
import { createFeedLogNotification } from '@/features/notification/domain/notification'
import { NotificationRepository } from '@/features/notification/repository/notification-repository'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { getJstDate } from '@/lib/utils/date-utils'
import { currentDirPath } from '@/lib/utils/path-utils'
import dayjs from 'dayjs'
import type { AwsFunctionHandler } from 'serverless/aws'

export const notifyUpdateHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/notify-update-handler.handler`,
}

export async function handler(_event: unknown) {
  // ユーザーの一覧を集める
  // ユーザー毎に今日作成されたFeedLogの一覧を集める
  // Notificationを作成、保存する

  const prisma = getPrismaClientInstance()

  const users = await prisma.user.findMany()
  for (const user of users) {
    try {
      await createNotification(user.id)
    } catch (e) {
      console.error(`userId=${user.id} の処理中にエラーが発生しました`, e)
    }
  }
}

async function createNotification(userId: string) {
  const notificationRepository = new NotificationRepository()

  const feedLogRepository = new FeedLogRepository()

  // JSTで今日の0時以降に作成されたFeedLogを集める
  const dateFrom = dayjs(getJstDate(new Date())).startOf('day')
  console.log(
    '-----------------------------------------------------------------------',
    new Date(),
    getJstDate(new Date()),
    dateFrom.toDate(),
  )
  const feedLogs =
    await feedLogRepository.findFeedLogListItemModelsSinceDateByUserId(
      userId,
      dateFrom.toDate(),
    )

  if (feedLogs.length === 0) {
    return
  }
  const notification = createFeedLogNotification(userId, feedLogs)
  await notificationRepository.save(notification)

  return notification
}
