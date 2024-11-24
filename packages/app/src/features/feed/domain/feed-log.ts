import { z } from "zod"
import { feedSchema } from "~/features/feed/domain/feed"

export const feedLogSchema = z.object({
  id: z.string(),
  feed: feedSchema,
  date: z.date().or(z.string()),
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  url: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type FeedLog = z.infer<typeof feedLogSchema>
