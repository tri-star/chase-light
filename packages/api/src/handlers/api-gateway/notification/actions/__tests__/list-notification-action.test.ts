import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type { NotificationSearchResult } from '@/features/notification/domain/notification'
import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { notificationApp } from '@/handlers/api-gateway/notification'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { NotificationFactory } from 'prisma/seeds/notification-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = notificationApp.getApp()
})

describe('ListNotificationAction', () => {
  test('10件取得できること', async () => {
    const user = await UserFactory.create()
    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    await NotificationFactory.createList(11, {
      user: {
        connect: {
          id: user.id,
        },
      },
    })

    const result = await app.request('/notifications')

    const json = (await result.json()) as NotificationSearchResult
    expect(json.total).toBe(11)
    expect(json.result.length).toBe(10)
    expect(json.result[0].createdAt)
  })

  test('新しい順であること', async () => {
    const user = await UserFactory.create()
    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    await NotificationFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      createdAt: new Date('2023-01-01T00:00:00+0900'),
    })
    const expected = await NotificationFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      createdAt: new Date('2023-01-02T00:00:00+0900'),
    })

    const result = await app.request('/notifications')

    const json = (await result.json()) as NotificationSearchResult
    expect(json.result[0].createdAt).toBe(expected.createdAt.toISOString())
  })
})
