import type { RawGitHubReleaseListItem } from '@/features/feed/domain/github-release'

export interface GitHubApiClientInterface {
  getReleases(owner: string, repo: string): Promise<RawGitHubReleaseListItem[]>
}
