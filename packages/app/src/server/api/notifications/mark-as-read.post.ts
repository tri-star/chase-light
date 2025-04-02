import { z } from 'zod'
import { createSsrApiClient } from '~/lib/api/client'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const schema = z.object({
      notificationIds: z.array(z.string()),
    })

    const parsedBody = schema.safeParse(body)
    if (!parsedBody.success) {
      return createError({
        statusCode: 400,
        message: 'Invalid request body',
      })
    }

    const apiClient = await createSsrApiClient(event)
    const response = await apiClient.post('/notifications/mark-as-read', {
      notificationIds: parsedBody.data.notificationIds,
    })

    return response
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    throw createError({
      statusCode: errorResponse.status,
      message: errorResponse.body,
    })
  }
})
