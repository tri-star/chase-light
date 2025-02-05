import type { GitHubReleaseListItem } from '@/features/feed/domain/github-release'
import { GitHubApiClient } from '@/features/feed/services/github-api-client'
import type { GitHubApiClientInterface } from '@/features/feed/services/github-api-client-interface'
import type { GitHubReleaseFinderInterface } from '@/features/feed/services/github-release-finder-interface'

export class GitHubReleaseFinder implements GitHubReleaseFinderInterface {
  private githubApiClient: GitHubApiClientInterface

  constructor(githubApiClient?: GitHubApiClientInterface) {
    this.githubApiClient = githubApiClient ?? new GitHubApiClient()
  }

  async list(
    owner: string,
    repo: string,
    lastSearchDate: Date | undefined,
  ): Promise<GitHubReleaseListItem[]> {
    const responseJson = await this.githubApiClient.getReleases(owner, repo)

    let filterResult = responseJson
    if (lastSearchDate) {
      filterResult = responseJson.filter(
        (release) => new Date(release.published_at) > lastSearchDate,
      )
    }

    return filterResult.map((item) => {
      const name = item.name ?? item.tag_name
      return {
        id: item.id,
        name,
        publishedAt: new Date(item.published_at),
      } satisfies GitHubReleaseListItem
    })
  }
}
