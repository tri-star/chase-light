import type { AppContext } from '@/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import type {
  SignupResult,
  SignupViaProvider,
  User,
} from '@/features/user/domain/user'
import { userApp } from '@/handlers/api-gateway/user'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = userApp.getApp()
})

describe('SignupVieProviderAction', () => {
  test.sequential('新規登録テスト', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = (await UserFactory.build()) as User

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request('/users/signup-via-provider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: '',
        idToken: '',
      } satisfies SignupViaProvider),
    })
    expect(result.status).toBe(200)
    expect(((await result.json()) as SignupResult).success).toBe(true)
  })
})
