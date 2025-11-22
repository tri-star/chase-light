interface FetchError {
  status: number
}

export function handleBackendApiError(error: unknown): never {
  if (error instanceof Error && error.name === 'ValidationError') {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid response format from backend API',
      data: { validationError: error.message },
    })
  }

  if (isFetchError(error)) {
    console.error('Backend API Error', {
      detail: error,
    })
    throw createError({
      statusCode: error.status,
    })
  }

  console.error('Unknown Error', {
    detail: error,
  })
  throw createError({
    statusCode: 500,
  })
}

function isFetchError(error: unknown): error is FetchError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  )
}
