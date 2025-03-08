import type { FetchError } from 'ofetch'

type H3ErrorLike = {
  data: {
    fatal: boolean
    statusCode: number
    statusMessage: string
    unhandled: boolean
  }
  message: string
}

export function getH3ErrorData<T = unknown>(
  error: FetchError<unknown> | null,
): T | null {
  if (!error) {
    return null
  }
  return (error.data as { data: T }).data ?? null
}

export function isFetchError(error: unknown): error is H3ErrorLike {
  if (!error || typeof error !== 'object') {
    return false
  }
  const maybeH3Error = error as Partial<H3ErrorLike>
  if (!maybeH3Error.data) {
    return false
  }
  if (!maybeH3Error.data.statusCode) {
    return false
  }
  return true
}

export function isNotFoundError(error: unknown): boolean {
  if (!isFetchError(error)) {
    return false
  }
  return error.data.statusCode === 404
}
