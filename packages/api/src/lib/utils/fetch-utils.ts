import { z } from 'zod'

const fetchErrorSchema = z.object({
  ok: z.boolean().optional(),
  status: z.number().optional(),
  cause: z
    .object({
      message: z.string(),
    })
    .optional(),
})
export type FetchError = z.infer<typeof fetchErrorSchema>

export function isFetchError(e: unknown): e is FetchError {
  return fetchErrorSchema.safeParse(e).success
}

export function handleFetchResponse(response: Response): Response {
  if (!response.ok) {
    throw response
  }
  return response
}
