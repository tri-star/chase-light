import { ExternalServiceError } from '@/errors/external-api-error'
import {
  releaseListItemSchema,
  type GitHubApiClientInterface,
  type ReleaseListItem,
} from '@/features/feed/services/github-api-client-interface'
import { handleFetchResponse, isFetchError } from '@/lib/utils/fetch-utils'
import { z } from 'zod'

export class GitHubApiClient implements GitHubApiClientInterface {
  async getReleases(owner: string, repo: string): Promise<ReleaseListItem[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`

    try {
      const response = handleFetchResponse(await fetch(url))
      const json = await response.json()

      const releases = z.array(releaseListItemSchema).parse(json)
      return releases
    } catch (e: unknown) {
      if (isFetchError(e)) {
        const externalServiceError = ExternalServiceError.fromFetchError(
          e,
          'GitHub API実行中にエラーが発生しました',
          {
            url,
          },
        )
        console.error(externalServiceError.getDetailedMessageWithStack())
        throw externalServiceError
      } else {
        const unknownError = ExternalServiceError.fromUnknownError(
          e,
          'GitHub API実行中にアプリケーション側でエラーが発生しました',
          {
            url,
          },
        )
        console.error(unknownError.getDetailedMessageWithStack())
        throw unknownError
      }
    }
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
