import { getApiNotifications } from '~/generated/api/backend'
import type { GetApiNotificationsParams } from '~/generated/api/schemas'
import { getApiNotificationsResponse } from '~/generated/api/zod/chaseLightAPI.zod'
import { requireUserSession } from '~/server/utils/session'
import { validateWithZod } from '~/utils/validation'

const NOTIFICATION_LIMIT_DEFAULT = 20
const NOTIFICATION_LIMIT_MAX = 50
const NOTIFICATION_LIMIT_MIN = 1
const VALID_READ_FILTERS = new Set(['all', 'read', 'unread'])

const isBackendError = (
  error: unknown
): error is { status: number; data?: unknown } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  )
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)

  const params: GetApiNotificationsParams = {}

  if (typeof query.cursor === 'string' && query.cursor.length > 0) {
    params.cursor = query.cursor
  }

  const limitRaw = typeof query.limit === 'string' ? query.limit : undefined
  if (limitRaw !== undefined) {
    const parsedLimit = Number.parseInt(limitRaw, 10)
    if (
      Number.isNaN(parsedLimit) ||
      parsedLimit < NOTIFICATION_LIMIT_MIN ||
      parsedLimit > NOTIFICATION_LIMIT_MAX
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid limit parameter',
      })
    }
    params.limit = parsedLimit
  } else {
    params.limit = NOTIFICATION_LIMIT_DEFAULT
  }

  const readRaw = typeof query.read === 'string' ? query.read : undefined
  if (readRaw !== undefined) {
    if (!VALID_READ_FILTERS.has(readRaw)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid read parameter',
      })
    }
    params.read = readRaw as GetApiNotificationsParams['read']
  } else {
    params.read = 'unread'
  }

  if (typeof query.search === 'string' && query.search.length > 0) {
    params.search = query.search
  }

  try {
    const response = await getApiNotifications(params)

    if (response.status === 200) {
      const validated = validateWithZod(
        getApiNotificationsResponse,
        response.data,
        'notifications API response'
      )
      return validated
    }

    throw createError({
      statusCode: response.status,
      statusMessage: 'Failed to fetch notifications',
      data: response.data,
    })
  } catch (error) {
    console.error('Failed to fetch notifications from backend:', error)

    if (isBackendError(error)) {
      if (error.status === 400 || error.status === 422) {
        throw createError({
          statusCode: error.status,
          statusMessage: 'Invalid request to notifications API',
          data: error.data,
        })
      }
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      throw createError({
        statusCode: 502,
        statusMessage: 'Invalid response format from notifications API',
        data: { validationError: error.message },
      })
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch notifications: ${message}`,
    })
  }
})
