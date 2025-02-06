import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import {
  FEED_VALIDATE_ERROR_DUPLICATE,
  FEED_VALIDATE_ERROR_NOT_SUPPORTED,
  type ValidateFeedUrlResponse,
} from '@/features/feed/domain/feed'
import { feedApp } from '@/handlers/api-gateway/feed'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { DataSourceFactory } from 'prisma/seeds/data-source-factory'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.getApp()
})

describe('ValidateFeedUrlAction', () => {
  test.each([
    {
      title: 'OK: GItHubのURL',
      url: 'https://github.com/aaa/bbb',
      expectedSuccess: true,
      expectedCode: undefined,
      expectedStatus: 200,
    },
    {
      title: 'NG: 重複するURL',
      url: 'https://github.com/duplicated/repo',
      expectedSuccess: false,
      expectedCode: FEED_VALIDATE_ERROR_DUPLICATE,
      expectedStatus: 409,
    },
    {
      title: 'NG: サポートされないURL',
      url: 'https://example.com',
      expectedSuccess: false,
      expectedCode: FEED_VALIDATE_ERROR_NOT_SUPPORTED,
      expectedStatus: 400,
    },
    {
      title: 'NG: URLではない形式',
      url: 'abcdefg',
      expectedSuccess: false,
      expectedCode: FEED_VALIDATE_ERROR_NOT_SUPPORTED,
      expectedStatus: 400,
    },
  ])(
    '$title',
    async ({ url, expectedSuccess, expectedCode, expectedStatus }) => {
      const stubTokenParser = new StubTokenParser()
      const user = await UserFactory.create()

      const dataSource = await DataSourceFactory.create({
        url: 'https://github.com/duplicated/repo',
      })

      await FeedFactory.create({
        dataSource: {
          connect: {
            id: dataSource.id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      })

      stubTokenParser.setUser(user)
      swapTokenParserForTest(stubTokenParser)

      const result = await app.request(`/feeds/validate-url?url=${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const resultJson = (await result.json()) as ValidateFeedUrlResponse
      expect(resultJson.success).toBe(expectedSuccess)
      expect(resultJson.code).toBe(expectedCode)
      expect(result.status).toBe(expectedStatus)
    },
  )
})
