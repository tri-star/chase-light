import { z } from 'zod'

export const githubReleaseListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  publishedAt: z.date(),
})
export type GitHubReleaseListItem = z.infer<typeof githubReleaseListItemSchema>
