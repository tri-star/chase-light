import { z } from 'zod'

export const datasourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type DataSource = z.infer<typeof datasourceSchema>
