import {
  releaseListItemSchema,
  type GitHubApiClientInterface,
  type ReleaseListItem,
} from '@/features/feed/services/github-api-client-interface'
import { z } from 'zod'

export class GitHubApiClient implements GitHubApiClientInterface {
  async getReleases(owner: string, repo: string): Promise<ReleaseListItem[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`
    const response = await fetch(url)
    const json = await response.json()

    const releases = z.array(releaseListItemSchema).parse(json)
    return releases
  }
}

let apiClient: GitHubApiClientInterface | undefined = undefined
export function getGitHubApiClient(): GitHubApiClientInterface {
  if (apiClient) {
    return apiClient
  }
  return new GitHubApiClient()
}

export function swapGitHubApiClientForTest(client: GitHubApiClientInterface) {
  apiClient = client
}
