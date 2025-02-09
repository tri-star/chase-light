import { z } from 'zod'

export const rawGithubReleaseListItemSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  tag_name: z.string(),
  published_at: z.string(),
})
export type RawGitHubReleaseListItem = z.infer<
  typeof rawGithubReleaseListItemSchema
>

export const githubReleaseListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  publishedAt: z.date(),
})
export type GitHubReleaseListItem = z.infer<typeof githubReleaseListItemSchema>

export const rawGitHubReleaseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  tag_name: z.string(),
  published_at: z.string(),
  body: z.string(),
  url: z.string(),
})
export type RawGitHubRelease = z.infer<typeof rawGitHubReleaseSchema>

export const gitHubRelease = z.object({
  id: z.number(),
  name: z.string().nullable(),
  tagName: z.string(),
  publishedAt: z.date(),
  body: z.string(),
  url: z.string(),
})
