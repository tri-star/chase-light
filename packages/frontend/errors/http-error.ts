// HTTP リクエストラッパー（features/shared/http/request-fetch.ts）向けのエラー正規化用
export class HttpError extends Error {
  readonly status: number
  readonly data: unknown
  readonly headers?: Headers

  constructor({
    status,
    message,
    data,
    headers,
  }: {
    status: number
    message?: string
    data?: unknown
    headers?: Headers
  }) {
    super(message ?? `HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.data = data
    this.headers = headers
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isServerError(): boolean {
    return this.status >= 500
  }
}

type FetchErrorLike = Partial<{
  status: number
  statusCode: number
  statusMessage: string
  data: unknown
  message: string
  response: {
    headers?: Headers
  }
}>

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error
  }

  const maybeFetchError = error as FetchErrorLike
  const status =
    maybeFetchError.status ??
    maybeFetchError.statusCode ??
    (error instanceof Error ? extractStatusFromMessage(error.message) : null) ??
    500

  const message =
    maybeFetchError.statusMessage ??
    maybeFetchError.message ??
    (error instanceof Error ? error.message : undefined) ??
    `HTTP ${status}`

  const headers = maybeFetchError.response?.headers
  const data = maybeFetchError.data

  return new HttpError({
    status,
    message,
    data,
    headers,
  })
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

/**
 * エラーオブジェクトからHTTPステータスコードを取得する
 * HttpError, H3Error, FetchError などに対応
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (error instanceof HttpError) {
    return error.status
  }

  // H3Error や FetchError など、status/statusCode プロパティを持つエラー
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof error.status === 'number') {
      return error.status
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode
    }
  }

  return null
}

/**
 * 404 Not Found エラーかどうかを判定する
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatusCode(error) === 404
}

function extractStatusFromMessage(message: string): number | null {
  const match = message.match(/HTTP\\s+(\\d{3})/)
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}
