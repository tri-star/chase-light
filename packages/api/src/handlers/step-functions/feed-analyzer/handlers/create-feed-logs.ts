import { getGitHubApiClient } from '@/features/feed/services/github-api-client'
import { GitHubReleaseFinder } from '@/features/feed/services/github-release-finder'
import { GitHubUrlParser } from '@/features/feed/services/github-url-parser'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import type { AwsFunctionHandler } from 'serverless/aws'
import { z } from 'zod'
import { v7 as uuidv7 } from 'uuid'
import dayjs from 'dayjs'

const createFeedLogsRequestSchema = z.object({
  feedId: z.string(),
})
type CreateFeedLogRequest = z.infer<typeof createFeedLogsRequestSchema>

export type CreateFeedLogResponse = {
  id: string
  title: string
  date: Date
}[]

export const createFeedLogsHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/create-feed-logs.handler`,
}

export async function handler(
  event: CreateFeedLogRequest,
  _context: Context,
): Promise<CreateFeedLogResponse> {
  const prisma = getPrismaClientInstance()

  const { feedId } = createFeedLogsRequestSchema.parse(event)

  const feed = await prisma.feed.findFirst({
    where: {
      id: feedId,
    },
    include: {
      feedGitHubMeta: true,
    },
  })

  if (!feed) {
    throw new Error(`feedId:  ${feedId} は見つかりません`)
  }

  const lastReleaseDate = feed?.feedGitHubMeta?.lastReleaseDate ?? undefined

  const githubUrlParser = new GitHubUrlParser()
  const { owner, repo } = githubUrlParser.parse(feed.url)

  const githubApiClient = getGitHubApiClient()
  const githubReleaseFinder = new GitHubReleaseFinder(githubApiClient)

  const releases = await githubReleaseFinder.list(owner, repo, lastReleaseDate)

  // TODO: releasesを元にFeedLogを作成する
  const feedLogs = []
  for (const release of releases) {
    const feedLogId = uuidv7()
    const feedLog = await prisma.feedLog.create({
      data: {
        id: feedLogId,
        date: release.publishedAt,
        title: release.name,
        feed: {
          connect: {
            id: feed.id,
          },
        },
        summary: '',
        url: `https://github.com/${owner}/${repo}/releases/tag/${release.name}`,
      },
    })
    feedLogs.push(feedLog)
  }

  const latestReleaseDate = releases.reduce((acc, release) => {
    if (dayjs(release.publishedAt).isBefore(acc)) {
      return acc
    }
    return release.publishedAt
  }, new Date('1900-01-01 00:00:00'))

  await prisma.feed.update({
    where: {
      id: feed.id,
    },
    data: {
      feedGitHubMeta: {
        upsert: {
          create: {
            id: uuidv7(),
            lastReleaseDate: latestReleaseDate,
          },
          update: {
            lastReleaseDate: latestReleaseDate,
          },
        },
      },
    },
    include: {
      feedGitHubMeta: true,
    },
  })

  // FeedLogのID一覧を返す
  return feedLogs.map((feedLog) => ({
    id: feedLog.id,
    title: feedLog.title,
    date: feedLog.date,
  }))
}
