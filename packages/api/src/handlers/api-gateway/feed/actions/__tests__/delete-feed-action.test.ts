import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { StubTokenParser } from '@/features/auth/services/stub-token-parser'
import { swapTokenParserForTest } from '@/features/auth/services/token-parser'
import { feedApp } from '@/handlers/api-gateway/feed'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { UserFactory } from 'prisma/seeds/user-factory'
import { FeedGitHubMetaFactory } from 'prisma/seeds/feed-github-meta-factory'
import { FeedLogFactory } from 'prisma/seeds/feed-log-factory'
import { beforeEach, describe, expect, test } from 'vitest'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.getApp()
})

describe('DeleteFeedAction', () => {
  test('フィードを削除できること', async () => {
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
    // フィードに関連するログを作成
    await FeedLogFactory.create({
      feed: {
        connect: {
          id: feed.id,
        },
      },
    })

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const result = await app.request(`/feeds/${feed.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json() as { success: boolean }
    expect(result.status).toBe(200)
    expect(resultJson.success).toBe(true)

    // フィードが実際に削除されたことを確認
    const prisma = getPrismaClientInstance()
    const deletedFeed = await prisma.feed.findUnique({
      where: { id: feed.id },
    })
    expect(deletedFeed).toBeNull()

    // 関連するGitHubMetaも削除されていることを確認
    const feedGithubMeta = await prisma.feedGitHubMeta.findFirst({
      where: { feedId: feed.id },
    })
    expect(feedGithubMeta).toBeNull()

    // 関連するログも削除されていることを確認
    const feedLogs = await prisma.feedLog.findMany({
      where: { feedId: feed.id },
    })
    expect(feedLogs.length).toBe(0)
  })

  test('存在しないフィードの場合は404エラーが返ること', async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const nonExistentFeedId = 'non-existent-id'
    const result = await app.request(`/feeds/${nonExistentFeedId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json() as { error: string }
    expect(result.status).toBe(404)
    expect(resultJson).toHaveProperty('error')
  })

  test('他のユーザーのフィードを削除しようとすると404エラーが返ること', async () => {
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
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resultJson = await result.json() as { error: string }
    expect(result.status).toBe(404)
    expect(resultJson).toHaveProperty('error')

    // フィードが削除されていないことを確認
    const prisma = getPrismaClientInstance()
    const notDeletedFeed = await prisma.feed.findUnique({
      where: { id: feed.id },
    })
    expect(notDeletedFeed).not.toBeNull()
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
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(result.status).toBe(401)

    // フィードが削除されていないことを確認
    const prisma = getPrismaClientInstance()
    const notDeletedFeed = await prisma.feed.findUnique({
      where: { id: feed.id },
    })
    expect(notDeletedFeed).not.toBeNull()
  })
})