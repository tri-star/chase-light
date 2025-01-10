import { z } from '@hono/zod-openapi'

export const datasourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
