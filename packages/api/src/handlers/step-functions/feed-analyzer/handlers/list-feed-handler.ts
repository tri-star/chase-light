import { handlerPath } from '@/lib/hono/handler-resolver'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'

type ListFeedResponse =
  | {
      success: true
      feedIds: string[]
    }
  | {
      success: false
      error: string
    }

export const listFeedHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/list-feed-handler.handler`,
}

export async function handler(
  _event: unknown,
  _context: Context,
): Promise<ListFeedResponse> {
  const prisma = getPrismaClientInstance()

  try {
    const feeds = await prisma.feed.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })
    return {
      success: true,
      feedIds: feeds.map((feed) => feed.id),
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      error: 'フィード一覧の取得に失敗しました',
    }
  }
}
