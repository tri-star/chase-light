interface ApiError {
  statusCode: number
  data?: unknown
}

export function handleBackendApiError(error: unknown): never {
  if (error instanceof Error && error.name === 'ValidationError') {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid response format from backend API',
      data: { validationError: error.message },
    })
  }

  if (isApiError(error)) {
    console.error('Backend API Error', {
      detail: error,
    })
    throw createError({
      statusCode: error.statusCode,
    })
  }

  throw createError({
    statusCode: 500,
  })
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  )
}
