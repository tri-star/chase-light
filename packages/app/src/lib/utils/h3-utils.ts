import type { FetchError } from 'ofetch'

export function getH3ErrorData<T = unknown>(
  error: FetchError<unknown> | null,
): T | null {
  if (!error) {
    return null
  }
  return (error.data as { data: T }).data ?? null
}
