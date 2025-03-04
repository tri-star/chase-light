import type { Feed } from '~/features/feed/domain/feed'

export default defineEventHandler(async (event) => {
  const feedId = event.context.params?.id as string

  if (!feedId) {
    throw createError({
      statusCode: 400,
      message: 'Feed ID is required',
    })
  }

  // 固定値でレスポンスを返す（APIが実装されたら置き換える）
  const dummyFeed: Feed = {
    id: feedId,
    name: `サンプルフィード ${feedId}`,
    url: 'https://github.com/nuxt/nuxt',
    cycle: 'daily',
    dataSource: {
      id: '1',
      name: 'GitHubリリース',
      url: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    createdAt: '2025-02-01T12:00:00.000Z',
    updatedAt: '2025-03-01T15:30:00.000Z',
  }

  // フィードの最終更新日時（仮）
  const lastReleaseDate = '2025-03-05T10:15:00.000Z'

  return {
    feed: dummyFeed,
    lastReleaseDate: lastReleaseDate,
  }
})