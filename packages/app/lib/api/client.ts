import { createApiClient } from "~/lib/api/client.generated"
import type { H3Event } from "h3"

export async function createSsrApiClient(event: H3Event) {
  const config = useRuntimeConfig()

  const session = await getUserSession(event)
  const token = session.secure?.accessToken

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const client = createApiClient(config.public.apiHost, {
    axiosConfig: {
      headers,
    },
  })
  return client
}
