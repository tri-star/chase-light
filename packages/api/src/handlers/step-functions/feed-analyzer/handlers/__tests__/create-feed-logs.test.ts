import { FeedFactory } from 'prisma/seeds/feed-factory'
import { describe, expect, test } from 'vitest'
import { handler } from '../create-feed-logs'
import type { Context } from 'aws-lambda'
import { GitHubApiClientStub } from '@/features/feed/services/github-api-client-stub'
import { swapGitHubApiClientForTest } from '@/features/feed/services/github-api-client'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import type { RawGitHubReleaseListItem } from '@/features/feed/domain/github-release'

describe('createFeedLogs', () => {
  test('初回は全てのリリースを対象にフィードを作成すること', async () => {
    const feed = await FeedFactory.create({
      url: 'https://github.com/owner/repo',
    })

    const githubReleaseListItems: RawGitHubReleaseListItem[] = [
      {
        id: 3,
        name: 'v1.0.2',
        tag_name: 'v1.0.2',
        published_at: '2021-01-03T00:00:00Z',
      },
      {
        id: 2,
        name: 'v1.0.1',
        tag_name: 'v1.0.1',
        published_at: '2021-01-02T00:00:00Z',
      },
      {
        id: 1,
        name: 'v1.0.0',
        tag_name: 'v1.0.0',
        published_at: '2021-01-01T00:00:00Z',
      },
    ]
    const stubGithubApiClient = new GitHubApiClientStub()
    stubGithubApiClient.setReleaseResponse(githubReleaseListItems)
    swapGitHubApiClientForTest(stubGithubApiClient)

    const response = await handler(feed.id, {} as Context)

    const filteredResponse = response.map((item) => {
      return {
        key: item.key,
        name: item.title,
        date: item.date,
      }
    })

    expect(filteredResponse).toEqual([
      {
        key: '3',
        name: 'v1.0.2',
        date: new Date('2021-01-03T00:00:00Z'),
      },
      {
        key: '2',
        name: 'v1.0.1',
        date: new Date('2021-01-02T00:00:00Z'),
      },
      {
        key: '1',
        name: 'v1.0.0',
        date: new Date('2021-01-01T00:00:00Z'),
      },
    ])

    const prisma = getPrismaClientInstance()
    const updatedFeed = await prisma.feed.findFirst({
      where: {
        id: feed.id,
      },
      include: {
        feedGitHubMeta: true,
        feedLogs: true,
      },
    })

    expect(
      updatedFeed?.feedLogs?.length,
      'feed_logsの登録件数が一致すること',
    ).toBe(3)
    expect(
      updatedFeed?.feedGitHubMeta,
      'feed_github_metasが登録されていること',
    ).not.toBeNull()
    expect(
      updatedFeed?.feedGitHubMeta?.lastReleaseDate,
      'latest_release_dateに最新のリリース日が記録されていること',
    ).toEqual(new Date('2021-01-03T00:00:00Z'))
  })
})
