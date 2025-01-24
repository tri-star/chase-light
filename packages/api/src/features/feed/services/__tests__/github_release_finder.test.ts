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
        publishedAt: '2021-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'v1.0.1',
        publishedAt: '2021-01-01T00:00:01Z',
      },
      {
        id: 3,
        name: 'v1.0.2',
        publishedAt: '2021-01-01T00:00:02Z',
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
})
