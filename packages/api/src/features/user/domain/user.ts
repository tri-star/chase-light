import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  accountName: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  providerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type User = z.infer<typeof userSchema>

export const createUserViaProviderSchema = z.object({
  accessToken: z.string(),
  idToken: z.string(),
})
export type CreateUserViaProvider = z.infer<typeof createUserViaProviderSchema>
