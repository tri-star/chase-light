import { z } from 'zod'

export const releaseListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  published_at: z.string(),
})
export type ReleaseListItem = z.infer<typeof releaseListItemSchema>

export interface GitHubApiClientInterface {
  getReleases(owner: string, repo: string): Promise<ReleaseListItem[]>
}
