import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import { feedApp } from '@/handlers/api-gateway/feed'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { FeedGitHubMetaFactory } from 'prisma/seeds/feed-github-meta-factory'
import { beforeEach, describe, expect, test } from 'vitest'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.getApp()
})

describe('FetchFeedAction', () => {
  test('フィード詳細情報を取得できること', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()
    const feed = await FeedFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
    })
    await FeedGitHubMetaFactory.create({
      lastReleaseDate: new Date('2025-03-01'),
      feed: {
        connect: {
          id: feed.id,
        },
      },
    })

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request(`/feeds/${feed.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json()
    expect(result.status).toBe(200)
    expect(resultJson).toHaveProperty('feed')
    expect(resultJson).toHaveProperty('lastReleaseDate')
    expect(resultJson.feed.id).toBe(feed.id)
    expect(resultJson.feed.name).toBe(feed.name)
  })

  test('存在しないフィードの場合は404エラーが返ること', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const nonExistentFeedId = 'non-existent-id'
    const result = await app.request(`/feeds/${nonExistentFeedId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json()
    expect(result.status).toBe(404)
    expect(resultJson).toHaveProperty('error')
    expect(resultJson.error).toBe('Feed not found')
  })

  test('他のユーザーのフィードにアクセスしようとすると404エラーが返ること', async () => {
    const stubTokenParser = new StubTokenParser()
    const owner = await UserFactory.create()
    const anotherUser = await UserFactory.create()
    const feed = await FeedFactory.create({
      user: {
        connect: {
          id: owner.id,
        },
      },
    })

    // 別のユーザーとしてログイン
    stubTokenParser.setUser(anotherUser)
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request(`/feeds/${feed.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json()
    expect(result.status).toBe(404)
    expect(resultJson).toHaveProperty('error')
    expect(resultJson.error).toBe('Feed not found')
  })

  test('認証されていない場合は401エラーが返ること', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()
    const feed = await FeedFactory.create({
      user: {
        connect: {
          id: user.id,
        },
      },
    })

    // ユーザーをセットしない（未認証状態）
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request(`/feeds/${feed.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json()
    expect(result.status).toBe(401)
    expect(resultJson).toHaveProperty('error')
    expect(resultJson.error).toBe('Unauthorized')
  })
})