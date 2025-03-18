import { z } from 'zod'

const notificationItemSchema = z.object({
  title: z.string(),
  feedLogId: z.string(),
})

export const notificationSchema = z.object({
  id: z.string(),
  date: z.string().or(z.date()),
  title: z.string(),
  contents: z.array(notificationItemSchema),
})
export type Notification = z.infer<typeof notificationSchema>
