import { z } from 'zod'

export const feedLogItemModelSchema = z.object({
  id: z.string(),
  feedLogId: z.string(),
  summary: z.string(),
  link: z
    .object({
      title: z.string(),
      url: z.string(),
    })
    .optional(),
  createdAt: z.date().or(z.string()),
})

export type FeedLogItemModel = z.infer<typeof feedLogItemModelSchema>

export const newFeedLogItemModelSchema = feedLogItemModelSchema.omit({
  createdAt: true,
})
export type NewFeedLogItemModel = z.infer<typeof newFeedLogItemModelSchema>
