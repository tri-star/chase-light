import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { notificationApp } from '@/handlers/api-gateway/notification'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { NotificationFactory } from 'prisma/seeds/notification-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = notificationApp.getApp()
})

describe('MarkAsReadAction', () => {
  test('通知が既読になること', async () => {
    const user = await UserFactory.create()
    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const notification1 = await NotificationFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      read: false,
    })

    const notification2 = await NotificationFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      read: false,
    })

    const response = await app.request('/notifications/mark-as-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationIds: [notification1.id, notification2.id],
      }),
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect((result as { success: boolean }).success).toBe(true)

    // 既読状態を確認
    const prisma = getPrismaClientInstance()
    const updatedNotification1 = await prisma.notification.findUnique({
      where: { id: notification1.id },
    })
    const updatedNotification2 = await prisma.notification.findUnique({
      where: { id: notification2.id },
    })

    expect(updatedNotification1?.read).toBe(true)
    expect(updatedNotification2?.read).toBe(true)
  })

  test('異なるユーザーの通知は既読にならないこと', async () => {
    const user1 = await UserFactory.create()
    const user2 = await UserFactory.create()

    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user1)
    swapTokenParserForTest(stubTokenParser)

    // user1の通知
    const notification1 = await NotificationFactory.create({
      user: {
        connect: {
          id: user1.id,
        },
      },
      read: false,
    })

    // user2の通知
    const notification2 = await NotificationFactory.create({
      user: {
        connect: {
          id: user2.id,
        },
      },
      read: false,
    })

    const response = await app.request('/notifications/mark-as-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationIds: [notification1.id, notification2.id],
      }),
    })

    expect(response.status).toBe(200)

    // 既読状態を確認
    const prisma = getPrismaClientInstance()
    const updatedNotification1 = await prisma.notification.findUnique({
      where: { id: notification1.id },
    })
    const updatedNotification2 = await prisma.notification.findUnique({
      where: { id: notification2.id },
    })

    // user1の通知は既読になっている
    expect(updatedNotification1?.read).toBe(true)
    // user2の通知は既読になっていない
    expect(updatedNotification2?.read).toBe(false)
  })

  test('空の配列の場合はエラーになること', async () => {
    const user = await UserFactory.create()
    const stubTokenParser = new StubTokenParser()
    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const response = await app.request('/notifications/mark-as-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationIds: [],
      }),
    })

    expect(response.status).toBe(400)
    const result = (await response.json()) as { error: unknown }
    expect(result.error).toBeDefined()
  })
})
