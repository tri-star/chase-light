import { DbNotFoundError } from '@/errors/db-not-found-error'
import { DbRelationError } from '@/errors/db-relation-error'
import {
  type FeedLogDetailModel,
  type FeedLogListItemModel,
  feedLogDetailModelSchema,
  feedLogListItemModelSchema,
} from '@/features/feed/domain/feed-log'
import {
  feedLogItemModelSchema,
  type FeedLogItemModel,
  type NewFeedLogItemModel,
} from '@/features/feed/domain/feed-log-item'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import type { CycleValue } from 'core/features/feed/feed'
import { FEED_LOG_STATUS_VALUE_MAP } from 'core/features/feed/feed-logs'
import { z } from 'zod'

export class FeedLogRepository {
  /**
   * 指定したIDのFeedLogを返す
   */
  async findById(feedLogId: string): Promise<FeedLogDetailModel> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLog = await prisma.feedLog.findFirst({
      where: {
        id: feedLogId,
      },
      include: {
        feed: {
          include: {
            dataSource: true,
            user: true,
          },
        },
      },
    })

    if (!loadedFeedLog) {
      throw new DbNotFoundError('feed_logs', `FeedLog not found: ${feedLogId}`)
    }

    if (loadedFeedLog.feed == null) {
      throw new DbRelationError(
        'feed_logs',
        `feed_logs.feedが見つかりません: ${feedLogId}`,
      )
    }
    if (loadedFeedLog.feed.user == null) {
      throw new DbRelationError(
        'feed_logs',
        `feed_logs.feedが見つかりません: ${feedLogId}`,
      )
    }
    if (loadedFeedLog.feed.dataSource == null) {
      throw new DbRelationError(
        'feed_logs',
        `feed_logs.feed.dataSourceが見つかりません: ${feedLogId}`,
      )
    }

    const feedLog = feedLogDetailModelSchema.parse({
      ...loadedFeedLog,
      body: loadedFeedLog.body ?? undefined,
      feed: {
        ...loadedFeedLog.feed,
        cycle: loadedFeedLog.feed.cycle as CycleValue,
      },
    } satisfies FeedLogDetailModel)
    return feedLog
  }
  /**
   * FeedLogを一覧画面での表示用に整形して返す
   */
  async findFeedLogsListItemModelsByFeedId(
    feedId: string,
  ): Promise<FeedLogListItemModel[]> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLogs = await prisma.feedLog.findMany({
      where: {
        feedId,
      },
      include: {
        feed: {
          include: {
            dataSource: true,
            user: true,
          },
        },
        feedLogItems: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    const logs = loadedFeedLogs.map((loadedFeedLog) => {
      return {
        ...loadedFeedLog,
        feed: {
          id: loadedFeedLog.feed.id,
          name: loadedFeedLog.feed.name,
        },
        items: loadedFeedLog.feedLogItems.map((item) => {
          return feedLogItemModelSchema.parse({
            id: item.id,
            summary: item.summary,
            feedLogId: item.feedLogId,
            ...(item.link_url !== ''
              ? {
                  link: {
                    title: item.link_title,
                    url: item.link_url,
                  },
                }
              : {}),
            createdAt: new Date(item.createdAt),
          } satisfies FeedLogItemModel)
        }),
      } satisfies FeedLogListItemModel
    })
    return z.array(feedLogListItemModelSchema).parse(logs)
  }

  /**
   * 指定ユーザーのFeedLogを一覧画面での表示用に整形して返す
   */
  async findFeedLogsListItemModelsByUserId(
    userId: string,
    pageSize: number,
    page = 1,
  ): Promise<{ count: number; items: FeedLogListItemModel[] }> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLogs = await prisma.feedLog.findMany({
      where: {
        feed: {
          userId,
        },
      },
      include: {
        feed: {
          include: {
            dataSource: true,
            user: true,
          },
        },
        feedLogItems: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    })

    const feedLogCount = await prisma.feedLog.count({
      where: {
        feed: {
          userId,
        },
      },
    })

    const logs = loadedFeedLogs.map((loadedFeedLog) => {
      return {
        ...loadedFeedLog,
        feed: {
          id: loadedFeedLog.feed.id,
          name: loadedFeedLog.feed.name,
        },
        items: loadedFeedLog.feedLogItems.map((item) => {
          return feedLogItemModelSchema.parse({
            id: item.id,
            summary: item.summary,
            feedLogId: item.feedLogId,
            ...(item.link_url !== ''
              ? {
                  link: {
                    title: item.link_title,
                    url: item.link_url,
                  },
                }
              : {}),
            createdAt: new Date(item.createdAt),
          } satisfies FeedLogItemModel)
        }),
      } satisfies FeedLogListItemModel
    })
    return {
      count: feedLogCount,
      items: z.array(feedLogListItemModelSchema).parse(logs),
    }
  }

  async findFeedLogListItemModelsSinceDateByUserId(
    userId: string,
    fromDate: Date,
  ): Promise<FeedLogListItemModel[]> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLogs = await prisma.feedLog.findMany({
      where: {
        feed: {
          userId,
        },
        createdAt: {
          gte: fromDate,
        },
      },
      include: {
        feed: {
          include: {
            dataSource: true,
            user: true,
          },
        },
        feedLogItems: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    const logs = loadedFeedLogs.map((loadedFeedLog) => {
      return {
        ...loadedFeedLog,
        feed: {
          id: loadedFeedLog.feed.id,
          name: loadedFeedLog.feed.name,
        },
        items: loadedFeedLog.feedLogItems.map((item) => {
          return feedLogItemModelSchema.parse({
            id: item.id,
            summary: item.summary,
            feedLogId: item.feedLogId,
            ...(item.link_url !== ''
              ? {
                  link: {
                    title: item.link_title,
                    url: item.link_url,
                  },
                }
              : {}),
            createdAt: new Date(item.createdAt),
          } satisfies FeedLogItemModel)
        }),
      } satisfies FeedLogListItemModel
    })
    return z.array(feedLogListItemModelSchema).parse(logs)
  }

  /**
   * 処理が完了していないFeedLogの一覧を返す
   */
  async findPendingFeedLogs(): Promise<FeedLogListItemModel[]> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLogs = await prisma.feedLog.findMany({
      where: {
        status: {
          in: [FEED_LOG_STATUS_VALUE_MAP.WAIT, FEED_LOG_STATUS_VALUE_MAP.ERROR],
        },
      },
      include: {
        feed: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    const logs = loadedFeedLogs.map((loadedFeedLog) => {
      return {
        ...loadedFeedLog,
        feed: {
          id: loadedFeedLog.feed.id,
          name: loadedFeedLog.feed.name,
        },
        items: [],
      } satisfies FeedLogListItemModel
    })
    return z.array(feedLogListItemModelSchema).parse(logs)
  }

  async save(feedLog: FeedLogDetailModel): Promise<void> {
    const prisma = getPrismaClientInstance()

    await prisma.feedLog.upsert({
      where: {
        id: feedLog.id,
      },
      create: {
        id: feedLog.id,
        feed: {
          connect: {
            id: feedLog.feedId,
          },
        },
        key: feedLog.key,
        date: feedLog.date,
        title: feedLog.title,
        url: feedLog.url,
        summary: '',
        body: feedLog.body ?? null,
        status: feedLog.status,
        createdAt: new Date(),
      },
      update: {
        key: feedLog.key,
        date: feedLog.date,
        title: feedLog.title,
        url: feedLog.url,
        body: feedLog.body ?? null,
        status: feedLog.status,
      },
    })
  }

  async clearFeedLogItems(feedLogId: string): Promise<void> {
    const prisma = getPrismaClientInstance()

    await prisma.feedLogItem.deleteMany({
      where: {
        feedLogId,
      },
    })
  }

  async saveFeedLogItems(items: NewFeedLogItemModel[]): Promise<void> {
    const prisma = getPrismaClientInstance()

    const feedLogItemsPromises = items.map((item) =>
      prisma.feedLogItem.create({
        data: {
          id: item.id,
          feedLog: {
            connect: {
              id: item.feedLogId,
            },
          },
          link_title: item.link?.title ?? '',
          link_url: item.link?.url ?? '',
          summary: item.summary,
        },
      }),
    )

    await Promise.all(feedLogItemsPromises)
  }
}
