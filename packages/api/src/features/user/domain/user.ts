import { z } from 'zod'

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

export const signupViaProviderSchema = z.object({
  accessToken: z.string(),
  idToken: z.string(),
})
export type SignupViaProvider = z.infer<typeof signupViaProviderSchema>

export const signupResultSchema = z.object({
  user: userSchema.optional(),
  success: z.boolean(),
  status: z.enum([
    'created',
    'updated',
    'duplicate_account',
    'no_verified_email',
  ]),
})

export type SignupResult = z.infer<typeof signupResultSchema>
