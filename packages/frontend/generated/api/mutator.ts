import type { ZodSchema } from 'zod'

interface FetchOptions extends RequestInit {
  zodSchema?: ZodSchema<unknown>
}

export const customFetch = <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  return fetch(url, options).then(async (response) => {
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
      ;(error as unknown as { status: number; data: unknown }).status = response.status
      ;(error as unknown as { status: number; data: unknown }).data = errorDetails
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
        return options.zodSchema.parse(responseData)
      } catch (zodError) {
        console.error('Response validation failed:', zodError)
        const error = new Error('Response validation failed')
        ;(error as unknown as { name: string; details: unknown; response: unknown }).name = 'ValidationError'
        ;(error as unknown as { name: string; details: unknown; response: unknown }).details = zodError
        ;(error as unknown as { name: string; details: unknown; response: unknown }).response = responseData
        throw error
      }
    }
    
    return responseData as T
  })
}
