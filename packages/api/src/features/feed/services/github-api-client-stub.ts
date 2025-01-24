import type {
  GitHubApiClientInterface,
  ReleaseListItem,
} from '@/features/feed/services/github-api-client-interface'

export class GitHubApiClientStub implements GitHubApiClientInterface {
  private releaseResponse: ReleaseListItem[] = [
    {
      id: 1,
      name: 'v1.0.0',
      publishedAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'v1.0.1',
      publishedAt: '2021-01-02T00:00:00Z',
    },
  ]

  async getReleases(_owner: string, _repo: string): Promise<ReleaseListItem[]> {
    return this.releaseResponse
  }

  setReleaseResponse(items: ReleaseListItem[]) {
    this.releaseResponse = items
  }
}
