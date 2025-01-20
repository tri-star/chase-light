import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'

export const listFeedHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/list-feed-handler.handler`,
}

export async function handler(_event: unknown, _context: Context) {
  return [1, 2, 3]
}
