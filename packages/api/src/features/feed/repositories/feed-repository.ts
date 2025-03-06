import { DbNotFoundError } from '@/errors/db-not-found-error'
import { DbRelationError } from '@/errors/db-relation-error'
import {
  feedDetailModelSchema,
  type Feed,
  type FeedDetailModel,
  type FeedGitHubMeta,
} from '@/features/feed/domain/feed'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import type { CycleValue } from 'core/features/feed/feed'
import { validate as validateUuid } from 'uuid'

export class FeedRepository {
  async findFeedById(feedId: string): Promise<FeedDetailModel> {
    const prisma = getPrismaClientInstance()

    if (!validateUuid(feedId)) {
      throw new DbNotFoundError('feeds', 'Feedのロードに失敗しました')
    }

    const loadedFeed = await prisma.feed.findFirst({
      where: {
        id: feedId,
      },
      include: {
        user: true,
        feedGitHubMeta: true,
        dataSource: true,
      },
    })

    if (loadedFeed == null) {
      console.error(`Feedのロードに失敗しました: ${feedId}`)
      throw new DbNotFoundError('feeds', 'Feedのロードに失敗しました')
    }

    if (loadedFeed.user == null) {
      console.error(`Feed.Userのロードに失敗しました: ${feedId}`)
      throw new DbRelationError('users', 'Feed.Userのロードに失敗しました')
    }

    if (loadedFeed.dataSource == null) {
      console.error(`Feed.DataSourceのロードに失敗しました: ${feedId}`)
      throw new DbRelationError(
        'data_sources',
        'Feed.DataSourceのロードに失敗しました',
      )
    }

    let feedGitHubMeta: FeedGitHubMeta | undefined = undefined
    if (loadedFeed.feedGitHubMeta) {
      feedGitHubMeta = {
        id: loadedFeed.feedGitHubMeta.id,
        lastReleaseDate: loadedFeed.feedGitHubMeta.lastReleaseDate ?? undefined,
      }
    }

    const feed = feedDetailModelSchema.parse({
      ...loadedFeed,
      cycle: loadedFeed.cycle as CycleValue,
      feedGitHubMeta,
    } satisfies FeedDetailModel)

    return feed
  }

  async saveFeed(feed: Feed) {
    const prisma = getPrismaClientInstance()

    await prisma.dataSource.upsert({
      where: {
        id: feed.dataSource.id,
      },
      create: {
        id: feed.dataSource.id,
        name: feed.dataSource.name,
        url: feed.dataSource.url,
      },
      update: {
        name: feed.dataSource.name,
        url: feed.dataSource.url,
      },
    })

    if (feed.feedGitHubMeta) {
      await prisma.feedGitHubMeta.upsert({
        where: {
          id: feed.feedGitHubMeta.id,
        },
        create: {
          id: feed.feedGitHubMeta.id,
          lastReleaseDate: feed.feedGitHubMeta.lastReleaseDate ?? undefined,
          feed: {
            connect: {
              id: feed.id,
            },
          },
        },
        update: {
          lastReleaseDate: feed.feedGitHubMeta.lastReleaseDate,
        },
      })
    }

    await prisma.feed.upsert({
      where: {
        id: feed.id,
      },
      create: {
        id: feed.id,
        url: feed.url,
        cycle: feed.cycle,
        name: feed.name,
        user: {
          connect: {
            id: feed.user.id,
          },
        },
        dataSource: {
          connect: {
            id: feed.dataSource.id,
          },
        },
      },
      update: {
        url: feed.url,
        cycle: feed.cycle,
        name: feed.name,
        user: {
          connect: {
            id: feed.user.id,
          },
        },
        dataSource: {
          connect: {
            id: feed.dataSource.id,
          },
        },
      },
    })
  }
}
