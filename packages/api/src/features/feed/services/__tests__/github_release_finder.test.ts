import { GitHubApiClientStub } from '@/features/feed/services/github-api-client-stub'
import { GitHubReleaseFinder } from '@/features/feed/services/github-release-finder'
import { describe, expect, test } from 'vitest'

describe('GitHubReleaseFinder', () => {
  test('指定した日付以降のリリースを取得できること', async () => {
    const gitHubApiClientStub = new GitHubApiClientStub()
    gitHubApiClientStub.setReleaseResponse([
      {
        id: 1,
        name: 'v1.0.0',
        tag_name: 'v1.0.0',
        published_at: '2021-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'v1.0.1',
        tag_name: 'v1.0.1',
        published_at: '2021-01-01T00:00:01Z',
      },
      {
        id: 3,
        name: 'v1.0.2',
        tag_name: 'v1.0.2',
        published_at: '2021-01-01T00:00:02Z',
      },
    ])

    const finder = new GitHubReleaseFinder(gitHubApiClientStub)
    const result = await finder.list(
      'owner',
      'repo',
      new Date('2021-01-01T00:00:01Z'),
    )

    expect(result).toEqual([
      {
        id: 3,
        name: 'v1.0.2',
        publishedAt: new Date('2021-01-01T00:00:02.000Z'),
      },
    ])
  })
  test('日付の昇順で取得していること', async () => {
    const gitHubApiClientStub = new GitHubApiClientStub()
    gitHubApiClientStub.setReleaseResponse([
      {
        id: 3,
        name: 'v1.0.2',
        tag_name: 'v1.0.2',
        published_at: '2021-01-01T00:00:02Z',
      },
      {
        id: 1,
        name: 'v1.0.0',
        tag_name: 'v1.0.0',
        published_at: '2021-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'v1.0.1',
        tag_name: 'v1.0.1',
        published_at: '2021-01-01T00:00:01Z',
      },
    ])

    const finder = new GitHubReleaseFinder(gitHubApiClientStub)
    const result = await finder.list(
      'owner',
      'repo',
      new Date('2020-12-31T00:00:00Z'),
    )

    expect(result).toEqual([
      {
        id: 1,
        name: 'v1.0.0',
        publishedAt: new Date('2021-01-01T00:00:00.000Z'),
      },
      {
        id: 2,
        name: 'v1.0.1',
        publishedAt: new Date('2021-01-01T00:00:01.000Z'),
      },
      {
        id: 3,
        name: 'v1.0.2',
        publishedAt: new Date('2021-01-01T00:00:02.000Z'),
      },
    ])
  })
  test('limit件数を超える場合、最後のlimit件を取得すること', async () => {
    const gitHubApiClientStub = new GitHubApiClientStub()
    gitHubApiClientStub.setReleaseResponse([
      {
        id: 1,
        name: 'v1.0.0',
        tag_name: 'v1.0.0',
        published_at: '2021-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'v1.0.1',
        tag_name: 'v1.0.1',
        published_at: '2021-01-01T00:00:01Z',
      },
      {
        id: 3,
        name: 'v1.0.2',
        tag_name: 'v1.0.2',
        published_at: '2021-01-01T00:00:02Z',
      },
      {
        id: 4,
        name: 'v1.0.3',
        tag_name: 'v1.0.3',
        published_at: '2021-01-01T00:00:03Z',
      },
      {
        id: 5,
        name: 'v1.0.4',
        tag_name: 'v1.0.4',
        published_at: '2021-01-01T00:00:04Z',
      },
    ])

    const finder = new GitHubReleaseFinder(gitHubApiClientStub)
    const result = await finder.list(
      'owner',
      'repo',
      new Date('2021-01-01T00:00:01Z'),
      3,
    )

    expect(result).toEqual([
      {
        id: 3,
        name: 'v1.0.2',
        publishedAt: new Date('2021-01-01T00:00:02.000Z'),
      },
      {
        id: 4,
        name: 'v1.0.3',
        publishedAt: new Date('2021-01-01T00:00:03.000Z'),
      },
      {
        id: 5,
        name: 'v1.0.4',
        publishedAt: new Date('2021-01-01T00:00:04.000Z'),
      },
    ])
  })
  test('nameがnullの場合はtag_nameを名前として採用すること', async () => {
    const gitHubApiClientStub = new GitHubApiClientStub()
    gitHubApiClientStub.setReleaseResponse([
      {
        id: 1,
        name: null,
        tag_name: 'v1.0.0',
        published_at: '2021-01-01T00:00:00Z',
      },
    ])

    const finder = new GitHubReleaseFinder(gitHubApiClientStub)
    const result = await finder.list('owner', 'repo', undefined)

    expect(result).toEqual([
      {
        id: 1,
        name: 'v1.0.0',
        publishedAt: new Date('2021-01-01T00:00:00.000Z'),
      },
    ])
  })
})
