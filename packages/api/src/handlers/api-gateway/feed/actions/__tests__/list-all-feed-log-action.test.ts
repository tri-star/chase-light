import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type { FeedLogSearchResultModel } from '@/features/feed/domain/feed-log'
import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { feedApp } from '@/handlers/api-gateway/feed'
import type { OpenAPIHono } from '@hono/zod-openapi'
import type { FeedLog } from '@prisma/client'
import dayjs from 'dayjs'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { feedLogFactory } from 'prisma/seeds/feed-log-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.getApp()
})

describe('listAllFeedLogAction', () => {
  test('新しい順でフィードログの一覧を取得できること', async () => {
    const user = await UserFactory.create()
    const feed = await FeedFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
    })
    const feedLogs: FeedLog[] = []
    for (let i = 1; i <= 10; i++) {
      feedLogs.push(
        await feedLogFactory.create({
          date: dayjs().add(i, 'day').toDate(),
          feed: {
            connect: {
              id: feed.id,
            },
          },
        }),
      )
    }

    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const response = await app.request('/feed-logs?pageSize=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const resultJson = (await response.json()) as FeedLogSearchResultModel
    expect(resultJson.total, '全FeedLogの件数を取得出来ていること').toBe(10)
    expect(resultJson.result.length, '最新の5件を取得していること').toBe(5)

    const lastIndex = feedLogs.length - 1
    expect(resultJson.result[0].id, '先頭の要素は1番新しい要素であること').toBe(
      feedLogs[lastIndex].id,
    )
  })
})
