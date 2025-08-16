import type { ZodSchema } from 'zod'

interface FetchOptions extends RequestInit {
  zodSchema?: ZodSchema<unknown>
}

// セッションからアクセストークンを取得
async function getAccessToken(): Promise<string | null> {
  try {
    // Server-side環境でのみ実行
    if (typeof window === 'undefined') {
      const event = useEvent()
      if (event) {
        return await getAccessTokenFromSession(event)
      }
      console.warn(
        'useEvent() returned null; cannot read session-based access token'
      )
      return null
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

// Orval mutator 期待仕様:
//   - 生成側は customFetch<T>() の T 自体が { data, status, headers } を含む合成レスポンス型 (union) になる
//   - したがって customFetch は『追加でラップせず』 Promise<T> を返す必要がある
// 現実装では二重ラップしていたため修正
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
      ;(
        error as unknown as { status: number; data: unknown; headers: Headers }
      ).status = response.status
      ;(
        error as unknown as { status: number; data: unknown; headers: Headers }
      ).data = errorDetails
      ;(
        error as unknown as { status: number; data: unknown; headers: Headers }
      ).headers = response.headers
      throw error
    }

    // 204 / No Content 対応: body が無い場合は undefined
    let payload: unknown = undefined
    if (response.status !== 204) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          payload = await response.json()
        } catch {
          // JSON 期待だったが parse 失敗 → 生テキスト
          try {
            payload = await response.text()
          } catch {
            payload = undefined
          }
        }
      } else {
        try {
          payload = await response.text()
        } catch {
          payload = undefined
        }
      }
    }

    // Zod バリデーション (成功時のみ上書き)
    if (options?.zodSchema) {
      try {
        payload = options.zodSchema.parse(payload)
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
        ).response = payload
        throw error
      }
    }

    // 合成レスポンス型 T にキャストして返却
    const composite = {
      data: payload,
      status: response.status,
      headers: response.headers,
    } as unknown as T
    return composite
  })
}
