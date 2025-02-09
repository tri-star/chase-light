import type {
  RawGitHubRelease,
  RawGitHubReleaseListItem,
} from '@/features/feed/domain/github-release'
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

  private fetchReleaseByIdResponse: RawGitHubRelease = {
    id: 1,
    name: 'v1.0.0',
    tag_name: 'v1.0.0',
    published_at: '2021-01-01T00:00:00Z',
    body: 'Release note',
    url: 'https://example.com',
  }

  async getReleases(
    _owner: string,
    _repo: string,
  ): Promise<RawGitHubReleaseListItem[]> {
    return this.releaseResponse
  }

  setReleaseResponse(items: RawGitHubReleaseListItem[]) {
    this.releaseResponse = items
  }

  async fetchReleaseById(
    _owner: string,
    _repo: string,
    _releaseId: number,
  ): Promise<RawGitHubRelease> {
    return this.fetchReleaseByIdResponse
  }

  setFetchReleaseByIdResponse(release: RawGitHubRelease) {
    this.fetchReleaseByIdResponse = release
  }
}
