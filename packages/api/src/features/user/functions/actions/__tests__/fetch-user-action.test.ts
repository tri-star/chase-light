import type { AppContext } from '@/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type { User } from '@/features/user/domain/user'
import { userApp } from '@/features/user/functions'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = userApp.getApp()
})

describe('FetchUserAction', () => {
  test.sequential(
    'ログインしているユーザーの情報を取得出来ること',
    async () => {
      const stubTokenParser = new StubTokenParser()
      const user = await UserFactory.create()

      stubTokenParser.setUser(user)
      swapTokenParserForTest(stubTokenParser)

      const result = await app.request('/users/self', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result.status).toBe(200)
      expect(((await result.json()) as { user: User }).user.providerId).toBe(
        user.providerId,
      )
    },
  )

  test.sequential('未ログイン時は401エラーを返す', async () => {
    const stubTokenParser = new StubTokenParser()
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request('/users/self', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(result.status).toBe(401)
  })
})
