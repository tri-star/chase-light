import type { RawGitHubReleaseListItem } from '@/features/feed/domain/github-release'
import type { GitHubApiClientInterface } from '@/features/feed/services/github-api-client-interface'

export class GitHubApiClientStub implements GitHubApiClientInterface {
  private releaseResponse: RawGitHubReleaseListItem[] = [
    {
      id: 1,
      name: 'v1.0.0',
      tag_name: 'v1.0.0',
      published_at: '2021-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: null,
      tag_name: 'v1.0.0',
      published_at: '2021-01-02T00:00:00Z',
    },
  ]

  async getReleases(
    _owner: string,
    _repo: string,
  ): Promise<RawGitHubReleaseListItem[]> {
    return this.releaseResponse
  }

  setReleaseResponse(items: RawGitHubReleaseListItem[]) {
    this.releaseResponse = items
  }
}
