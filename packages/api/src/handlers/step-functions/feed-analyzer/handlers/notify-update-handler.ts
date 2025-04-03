import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'
import { createFeedLogNotification } from '@/features/notification/domain/notification'
import { NotificationRepository } from '@/features/notification/repository/notification-repository'
import { SystemSettingRepository } from '@/features/common/repository/system-setting-repository'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { currentDirPath } from '@/lib/utils/path-utils'
import dayjs from 'dayjs'
import type { AwsFunctionHandler } from 'serverless/aws'

export const notifyUpdateHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/notify-update-handler.handler`,
  timeout: 60,
}

export async function handler(_event: unknown) {
  // ユーザーの一覧を集める
  // ユーザー毎に前回バッチ実行以降に作成されたFeedLogの一覧を集める
  // Notificationを作成、保存する

  const prisma = getPrismaClientInstance()
  const systemSettingRepository = new SystemSettingRepository()

  // 前回実行時刻を取得。ない場合は24時間前とする
  const systemSetting = await systemSettingRepository.getOrCreateSystemSetting()
  const fromDate = systemSetting.lastNotificationRunDate
    ? systemSetting.lastNotificationRunDate
    : dayjs().subtract(24, 'hour').toDate()

  // 現在時刻を記録（処理完了後に更新するため）
  const now = new Date()

  try {
    const users = await prisma.user.findMany()
    for (const user of users) {
      try {
        await createNotification(user.id, fromDate)
      } catch (e) {
        console.error(`userId=${user.id} の処理中にエラーが発生しました`, e)
      }
    }

    // バッチ処理の完了時に現在時刻を記録
    await systemSettingRepository.updateLastNotificationRunDate(now)
  } catch (e) {
    console.error('お知らせ生成処理中にエラーが発生しました', e)
    throw e
  }
}

async function createNotification(userId: string, fromDate: Date) {
  const notificationRepository = new NotificationRepository()
  const feedLogRepository = new FeedLogRepository()

  // 前回バッチ実行時以降に作成されたFeedLogを集める
  const feedLogs =
    await feedLogRepository.findFeedLogListItemModelsSinceDateByUserId(
      userId,
      fromDate,
    )

  if (feedLogs.length === 0) {
    return
  }
  const notification = createFeedLogNotification(userId, feedLogs)
  await notificationRepository.save(notification)

  return notification
}
