import type { Feed } from '@/features/feed/domain/feed'
import type { FeedLogDetailModel } from '@/features/feed/domain/feed-log'
import type { GitHubReleaseListItem } from '@/features/feed/domain/github-release'
import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'
import { FeedRepository } from '@/features/feed/repositories/feed-repository'
import { getGitHubApiClient } from '@/features/feed/services/github-api-client'
import type { GitHubApiClientInterface } from '@/features/feed/services/github-api-client-interface'
import { GitHubReleaseFinder } from '@/features/feed/services/github-release-finder'
import type { GitHubReleaseFinderInterface } from '@/features/feed/services/github-release-finder-interface'
import { GitHubUrlParser } from '@/features/feed/services/github-url-parser'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import dayjs from 'dayjs'
import { v7 as uuidv7 } from 'uuid'

export class CreateFeedLogUseCase {
  private prisma: ReturnType<typeof getPrismaClientInstance>

  private feedRepository: FeedRepository

  private feedLogRepository: FeedLogRepository

  private githubUrlParser: GitHubUrlParser

  private githubApiClient: GitHubApiClientInterface

  private githubReleaseFinder: GitHubReleaseFinderInterface

  constructor() {
    this.prisma = getPrismaClientInstance()
    this.feedRepository = new FeedRepository()
    this.feedLogRepository = new FeedLogRepository()
    this.githubUrlParser = new GitHubUrlParser()
    this.githubApiClient = getGitHubApiClient()
    this.githubReleaseFinder = new GitHubReleaseFinder(this.githubApiClient)
  }

  async execute(feedId: string): Promise<FeedLogDetailModel[]> {
    const feed = await this.feedRepository.findFeedById(feedId)

    if (!feed) {
      throw new Error(`feedId:  ${feedId} は見つかりません`)
    }

    const releases = await this.listReleasesAfter(
      feed.url,
      feed.feedGitHubMeta?.lastReleaseDate ?? undefined,
    )

    const feedLogs = await this.createFeedLogs(feed, releases)

    const previousReleaseDate =
      feed.feedGitHubMeta?.lastReleaseDate ?? new Date('1900-01-01 00:00:00')
    const latestReleaseDate = releases.reduce((acc, release) => {
      if (dayjs(release.publishedAt).isBefore(acc)) {
        return acc
      }
      return release.publishedAt
    }, previousReleaseDate)

    feed.feedGitHubMeta = {
      id: feed.feedGitHubMeta?.id ?? uuidv7(),
      lastReleaseDate: latestReleaseDate,
    }
    await this.feedRepository.saveFeed(feed)

    return feedLogs
  }

  private async listReleasesAfter(
    url: string,
    lastReleaseDate: Date | undefined,
  ): Promise<GitHubReleaseListItem[]> {
    const { owner, repo } = this.githubUrlParser.parse(url)
    return this.githubReleaseFinder.list(owner, repo, lastReleaseDate)
  }

  private async createFeedLogs(
    feed: Feed,
    releases: GitHubReleaseListItem[],
  ): Promise<FeedLogDetailModel[]> {
    const { owner, repo } = this.githubUrlParser.parse(feed.url)
    const feedLogs = []
    for (const release of releases) {
      const feedLogId = uuidv7()
      const feedLog = await this.feedLogRepository.saveFeedLog({
        id: feedLogId,
        key: release.id.toString(),
        date: release.publishedAt,
        title: release.name,
        feedId: feed.id,
        url: `https://github.com/${owner}/${repo}/releases/tag/${release.name}`,
      })

      feedLogs.push(feedLog)
    }

    return feedLogs
  }
}
