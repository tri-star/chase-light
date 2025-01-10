import { isAxiosError } from 'axios'
import { createSsrApiClient } from '~/lib/api/client'

export default defineEventHandler(
  async (event): Promise<{ success: boolean; code?: string }> => {
    const client = await createSsrApiClient(event)

    const queries = getQuery(event)

    try {
      const response = await client.getFeedsvalidateUrl({
        queries: {
          url: queries['url'] as string,
        },
      })

      event.node.res.statusCode = Number(response.code ?? 200)
      return {
        success: response.success,
        code: response.code,
      }
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        throw createError({
          status: e.response?.status ?? 500,
          data: {
            success: false,
            code: e.response?.data['code'],
          },
        })
      } else {
        throw createError({
          status: 500,
        })
      }
    }
  },
)
