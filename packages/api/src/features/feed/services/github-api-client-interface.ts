import type {
  RawGitHubRelease,
  RawGitHubReleaseListItem,
} from '@/features/feed/domain/github-release'

export interface GitHubApiClientInterface {
  getReleases(owner: string, repo: string): Promise<RawGitHubReleaseListItem[]>

  fetchReleaseById(
    owner: string,
    repo: string,
    releaseId: number,
  ): Promise<RawGitHubRelease>
}
