import type { GitHubReleaseListItem } from '@/features/feed/domain/github-release'

export interface GitHubReleaseFinderInterface {
  list(
    owner: string,
    repo: string,
    lastSearchDate: Date | undefined,
  ): Promise<GitHubReleaseListItem[]>
}
