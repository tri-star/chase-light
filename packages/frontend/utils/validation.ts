import type { ZodSchema, ZodError } from 'zod'

/**
 * Zodスキーマを使ってデータをバリデーションし、エラーハンドリングを統一する
 */
export function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as ZodError
      const errorMessage = zodError.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')

      console.error(
        `Validation failed${context ? ` for ${context}` : ''}:`,
        errorMessage
      )

      const validationError = new Error(
        `Validation failed${context ? ` for ${context}` : ''}: ${errorMessage}`
      )
      ;(
        validationError as unknown as {
          name: string
          zodError: ZodError
          originalData: unknown
        }
      ).name = 'ValidationError'
      ;(
        validationError as unknown as {
          name: string
          zodError: ZodError
          originalData: unknown
        }
      ).zodError = zodError
      ;(
        validationError as unknown as {
          name: string
          zodError: ZodError
          originalData: unknown
        }
      ).originalData = data

      throw validationError
    }
    throw error
  }
}

/**
 * Zodスキーマを使って安全にデータをパースする（エラー時はundefinedを返す）
 */
export function safeParseWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | undefined {
  try {
    return schema.parse(data)
  } catch {
    return undefined
  }
}
