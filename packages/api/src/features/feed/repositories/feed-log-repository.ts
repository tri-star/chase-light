import { DbNotFoundError } from '@/errors/db-not-found-error'
import { DbRelationError } from '@/errors/db-relation-error'
import {
  type FeedLogCreateCommand,
  type FeedLogDetailModel,
  type FeedLogListItemModel,
  feedLogDetailModelSchema,
  feedLogListItemModelSchema,
} from '@/features/feed/domain/feed-log'
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
      } satisfies FeedLogListItemModel
    })
    return z.array(feedLogListItemModelSchema).parse(logs)
  }

  /**
   * 指定ユーザーのFeedLogを一覧画面での表示用に整形して返す
   */
  async findFeedLogsListItemModelsByUserId(
    userId: string,
  ): Promise<FeedLogListItemModel[]> {
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
      } satisfies FeedLogListItemModel
    })
    return z.array(feedLogListItemModelSchema).parse(logs)
  }

  async saveFeedLog(
    request: FeedLogCreateCommand,
  ): Promise<FeedLogDetailModel> {
    const prisma = getPrismaClientInstance()

    const loadedFeedLog = await prisma.feedLog.upsert({
      where: {
        id: request.id,
      },
      create: {
        id: request.id,
        feed: {
          connect: {
            id: request.feedId,
          },
        },
        key: request.key,
        date: request.date,
        title: request.title,
        url: request.url,
        summary: '',
      },
      update: {
        key: request.key,
        date: request.date,
        title: request.title,
        url: request.url,
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

    return feedLogDetailModelSchema.parse({
      ...loadedFeedLog,
      body: loadedFeedLog.body ?? undefined,
      feed: {
        ...loadedFeedLog.feed,
        cycle: loadedFeedLog.feed.cycle as CycleValue,
      },
    } satisfies FeedLogDetailModel)
  }

  async clearFeedLogItems(feedLogId: string): Promise<void> {
    const prisma = getPrismaClientInstance()

    await prisma.feedLogItem.deleteMany({
      where: {
        feedLogId,
      },
    })
  }
}
