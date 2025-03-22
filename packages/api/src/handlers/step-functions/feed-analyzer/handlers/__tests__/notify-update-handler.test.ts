import { FeedFactory } from 'prisma/seeds/feed-factory'
import { FeedLogFactory } from 'prisma/seeds/feed-log-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { vi, describe, expect, test, beforeEach, afterEach } from 'vitest'
import { handler } from '../notify-update-handler'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

describe('NotifyUpdateHandler', () => {
  test('日本時間で当日に作成されたFeedLogに対する通知を作成すること', async () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const user = await UserFactory.create()
    const testNow = new Date('2025-01-02T00:00:00+0900')
    vi.setSystemTime(testNow)
    console.log('Test time set to:', new Date())

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
        createdAt: testNow,
      })
    }

    // 1日前のFeedLogを作成
    const yesterday = new Date('2025-01-01 23:59:59+0900')
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
      createdAt: yesterday,
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
  })
})
