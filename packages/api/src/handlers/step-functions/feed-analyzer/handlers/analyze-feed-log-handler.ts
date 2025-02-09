import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'
import { GitHubApiClient } from '@/features/feed/services/github-api-client'
import { getGitHubReleaseAnalyzer } from '@/features/feed/services/github-release-analyzer'
import { GitHubUrlParser } from '@/features/feed/services/github-url-parser'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import type { Context } from 'aws-lambda'
import { FEED_LOG_STATUS_VALUE_MAP } from 'core/features/feed/feed-logs'
import type { AwsFunctionHandler } from 'serverless/aws'
import z from 'zod'

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

export async function handler(payload: AnalyzeFeedRequest, _context: Context) {
  // feedLogの情報を取得する
  const { feedLogId } = analyzeFeedRequestSchema.parse(payload)
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
  await githubReleaseAnalyzer.analyze(release.body)

  // GitHubReleaseAnalyzer
  //   LLMでリリース内容を以下のように分解
  //    - 「description #PR-number」の構造はdescription, PR-numberに分解
  //      - PRのURLをurlに設定
  //      - このタイミングでdescriptionを日本語化
  //    - この形式に当てはまらない場合はdescriptionに内容をまとめる
  //      - 外部URLを含む場合はurlにURLを設定
  //    - 解析結果はAnalyzeResultItem型のオブジェクトとして返す
  //      - ドキュメントの更新、chore系の内容は除外する
  // AnalyzeResultItemをFeedLogItemなどのモデル名でDBに保存
  // feedLogを完了に更新
  //
}
