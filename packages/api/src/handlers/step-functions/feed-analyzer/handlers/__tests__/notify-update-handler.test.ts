import { FeedFactory } from 'prisma/seeds/feed-factory'
import { FeedLogFactory } from 'prisma/seeds/feed-log-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { vi, describe, expect, test, beforeEach, afterEach } from 'vitest'
import { handler } from '../notify-update-handler'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { withTransactionManager } from '@/lib/vitest/transaction-manager-helper'

describe('NotifyUpdateHandler', () => {
  test(
    '初回は24時間以内に作成されたFeedLogを対象とすること',
    withTransactionManager(async () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      const user = await UserFactory.create()
      const testNow = new Date('2025-01-02T00:00:00+0900')
      vi.setSystemTime(testNow)

      // それぞれのFeedLogに別々のFeedを割り当てる
      for (let i = 0; i < 2; i++) {
        const feed = await FeedFactory.create({
          user: {
            connect: {
              id: user.id,
            },
          },
        })
        await FeedLogFactory.create({
          feed: {
            connect: {
              id: feed.id,
            },
          },
          createdAt: new Date('2025-01-01 00:00:00+0900'), // ギリギリ24時間以内
        })
      }

      // 24時間以上前のFeedLogを作成
      const oldFeed = await FeedFactory.create({
        user: {
          connect: {
            id: user.id,
          },
        },
      })
      await FeedLogFactory.create({
        feed: {
          connect: {
            id: oldFeed.id,
          },
        },
        createdAt: new Date('2024-12-31 23:59:59+0900'),
      })

      // 通知作成処理の実行
      await handler({})

      const prisma = getPrismaClientInstance()
      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
        },
        include: {
          notificationItems: true,
        },
      })

      expect(notifications.length, 'お知らせ全体は1件であること').toBe(1)
      expect(
        notifications[0].notificationItems.length,
        'お知らせの内容は今日作成されたFeedLogであること',
      ).toBe(2)
    }),
  )

  test(
    '2回目は1回目以降に作成されたFeedLogを対象とすること',
    withTransactionManager(async () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      const user = await UserFactory.create()
      const testNow = new Date('2025-01-02T00:00:00+0900')
      vi.setSystemTime(testNow)

      const feed = await FeedFactory.create({
        user: {
          connect: {
            id: user.id,
          },
        },
      })
      for (let i = 0; i < 2; i++) {
        await FeedLogFactory.create({
          feed: {
            connect: {
              id: feed.id,
            },
          },
          createdAt: new Date('2025-01-01 15:00:00+0900'),
        })
      }

      // 1回目の実行。
      await handler({})

      // 時間を少し進めてフィードログを作成
      vi.setSystemTime('2025-01-02T10:00:00+0900')

      await FeedLogFactory.create({
        feed: {
          connect: {
            id: feed.id,
          },
        },
        createdAt: new Date(),
      })

      // 2回目の実行
      await handler({})

      // 最後に作成されたお知らせを1件取得
      const prisma = getPrismaClientInstance()
      const latestNotification = await prisma.notification.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          notificationItems: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(
        latestNotification?.notificationItems.length,
        '最新のお知らせの内容は1回目の後で作成されたFeedLogであること',
      ).toBe(1)
    }),
  )
})
