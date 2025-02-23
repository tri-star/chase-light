import { handlerPath } from '@/lib/hono/handler-resolver'
import {
  getPrismaClientInstance,
  setupQueryLogger,
} from '@/lib/prisma/app-prisma-client'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'

type ListFeedResponse = {
  feedIds: string[]
}

export const listFeedHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/list-feed-handler.handler`,
}

export async function handler(
  _event: unknown,
  _context: Context,
): Promise<ListFeedResponse> {
  const prisma = getPrismaClientInstance(true)
  setupQueryLogger(prisma)

  try {
    const feeds = await prisma.feed.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })
    return {
      feedIds: feeds.map((feed) => feed.id),
    }
  } catch (e) {
    console.error(e)
    throw new Error('フィード一覧取得時にエラーが発生しました')
  }
}
