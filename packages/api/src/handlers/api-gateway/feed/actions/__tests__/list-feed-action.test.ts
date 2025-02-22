import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type { feedSearchResult } from '@/features/feed/domain/feed'
import { feedApp } from '@/handlers/api-gateway/feed'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.createApp()
})

describe('ListFeedAction', () => {
  test('フィード一覧を取得できること', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()
    await FeedFactory.createList(5, {
      user: {
        connect: {
          id: user.id,
        },
      },
    })

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request('/feeds', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = (await result.json()) as feedSearchResult
    expect(resultJson.result.length).toBe(5)
    expect(result.status).toBe(200)
  })
})
