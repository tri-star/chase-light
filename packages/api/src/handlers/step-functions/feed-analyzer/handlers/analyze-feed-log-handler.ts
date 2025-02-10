import type { NewFeedLogItemModel } from '@/features/feed/domain/feed-log-item'
import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'
import { getAnalyzeFeedLogQueue } from '@/features/feed/services/analyze-feed-log-queue'
import { GitHubApiClient } from '@/features/feed/services/github-api-client'
import { getGitHubReleaseAnalyzer } from '@/features/feed/services/github-release-analyzer'
import { GitHubUrlParser } from '@/features/feed/services/github-url-parser'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context, SQSEvent } from 'aws-lambda'
import { FEED_LOG_STATUS_VALUE_MAP } from 'core/features/feed/feed-logs'
import type { AwsFunctionHandler } from 'serverless/aws'
import z from 'zod'
import { v7 as uuidv7 } from 'uuid'

export const analyzeFeedRequestSchema = z.object({
  feedLogId: z.string(),
})
type AnalyzeFeedRequest = z.infer<typeof analyzeFeedRequestSchema>

export const analyzeFeedLogHandler: AwsFunctionHandler = {
  handler: `${handlerPath(currentDirPath(import.meta.url))}/analyze-feed-log-handler.handler`,
  reservedConcurrency: 3,
  timeout: 300,
  events: [
    {
      sqs: {
        arn: {
          'Fn::GetAtt': ['FeedAnalyzeQueue', 'Arn'],
        },
        batchSize: 10,
      },
    },
  ],
}

export async function handler(event: SQSEvent, _context: Context) {
  for (const record of event.Records) {
    await handleEvent(record.receiptHandle, JSON.parse(record.body))
  }
}

async function handleEvent(receiptHandle: string, request: AnalyzeFeedRequest) {
  const { feedLogId } = analyzeFeedRequestSchema.parse(request)
  const feedLogRepository = new FeedLogRepository()

  // TODO: feedLogが見つからない場合などアプリ起因の場合、このジョブはリトライ不能で失敗させる
  // TODO: GitHub API、Open AI API起因のエラーの場合はリトライ可能な失敗とする
  const feedLog = await feedLogRepository.findById(feedLogId)

  // feedLogを解析中に更新
  feedLog.status = FEED_LOG_STATUS_VALUE_MAP.IN_PROGRESS
  await feedLogRepository.saveFeedLog(feedLog)

  await feedLogRepository.clearFeedLogItems(feedLogId)

  // GitHub APIでリリース本文を取得
  const githubUrlParser = new GitHubUrlParser()
  const githubApiClient = new GitHubApiClient()

  const { owner, repo } = githubUrlParser.parse(feedLog.feed.url)
  const release = await githubApiClient.fetchReleaseById(
    owner,
    repo,
    Number(feedLog.key),
  )

  const githubReleaseAnalyzer = getGitHubReleaseAnalyzer()
  const analyzeResultItems = await githubReleaseAnalyzer.analyze(release.body)

  const feedLogItems: NewFeedLogItemModel[] = analyzeResultItems.map(
    (analyzeResultItem) => ({
      id: uuidv7(),
      feedLogId: feedLog.id,
      summary: analyzeResultItem.summary,
      link: analyzeResultItem.link,
    }),
  )
  await feedLogRepository.saveFeedLogItems(feedLogItems)

  const analyzeFeedLogQueue = getAnalyzeFeedLogQueue()
  await analyzeFeedLogQueue.complete(receiptHandle)
}
