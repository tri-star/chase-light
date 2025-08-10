import type { ZodSchema } from 'zod'

interface FetchOptions extends RequestInit {
  zodSchema?: ZodSchema<unknown>
}

// AsyncLocalStorageを使ってアクセストークンを取得
async function getAccessToken(): Promise<string | null> {
  try {
    // Server-side環境でのみ実行
    if (typeof window === 'undefined') {
      return await getAccessTokenFromALS()
    }
  } catch (error) {
    console.warn('Failed to get access token:', error)
  }
  return null
}

// ヘッダーが Record<string, string> 型かどうかをチェックするヘルパー関数
const isHeadersRecord = (
  headers: HeadersInit | undefined
): headers is Record<string, string> => {
  return (
    headers !== undefined &&
    typeof headers === 'object' &&
    !Array.isArray(headers) &&
    !(headers instanceof Headers)
  )
}

export const customFetch = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  // リクエストオプションの準備
  const fetchOptions: RequestInit = { ...options }

  // Authorizationヘッダーが既に設定されていない場合のみアクセストークンを追加
  const hasAuthHeader =
    (isHeadersRecord(fetchOptions.headers) &&
      (fetchOptions.headers['Authorization'] ||
        fetchOptions.headers['authorization'])) ||
    (fetchOptions.headers instanceof Headers &&
      fetchOptions.headers.has('Authorization'))

  if (!hasAuthHeader) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  }

  return fetch(url, fetchOptions).then(async (response) => {
    if (!response.ok) {
      let errorDetails: unknown
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json()
        } catch {
          errorDetails = await response.text()
        }
      } else {
        errorDetails = await response.text()
      }

      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as unknown as { status: number; data: unknown }).status =
        response.status
      ;(error as unknown as { status: number; data: unknown }).data =
        errorDetails
      throw error
    }

    const contentType = response.headers.get('content-type')
    let responseData: unknown

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    // Zodスキーマが提供されている場合はバリデーションを実行
    if (options?.zodSchema) {
      try {
        return options.zodSchema.parse(responseData) as T
      } catch (zodError) {
        console.error('Response validation failed:', zodError)
        const error = new Error('Response validation failed')
        ;(
          error as unknown as {
            name: string
            details: unknown
            response: unknown
          }
        ).name = 'ValidationError'
        ;(
          error as unknown as {
            name: string
            details: unknown
            response: unknown
          }
        ).details = zodError
        ;(
          error as unknown as {
            name: string
            details: unknown
            response: unknown
          }
        ).response = responseData
        throw error
      }
    }

    return responseData as T
  })
}
