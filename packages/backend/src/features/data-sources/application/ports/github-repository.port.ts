export type GitHubRepositoryDto = {
  id: number
  fullName: string
  name: string
  description: string | null
  htmlUrl: string
  private: boolean
  language: string | null
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  fork: boolean
}

export interface GitHubRepositoryPort {
  getRepository(owner: string, repo: string): Promise<GitHubRepositoryDto>
}
