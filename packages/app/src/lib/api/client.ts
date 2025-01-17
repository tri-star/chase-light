import { createApiClient } from '~/lib/api/client.generated'
import type { H3Event } from 'h3'
import type {
  Method,
  ZodiosPathsByMethod,
  ZodiosQueryParamsByAlias,
  ZodiosQueryParamsByPath,
} from '@zodios/core'
import { getActiveAccessToken } from '~/lib/api/api-auth'

export async function createSsrApiClient(event: H3Event) {
  const config = useRuntimeConfig()

  const token = await getActiveAccessToken(event)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const client = createApiClient(config.public.apiHost, {
    axiosConfig: {
      headers,
    },
  })
  return client
}

export type ApiQueryParametersByPath<
  M extends Method,
  P extends ZodiosPathsByMethod<ReturnType<typeof createApiClient>['api'], M>,
> = ZodiosQueryParamsByPath<ReturnType<typeof createApiClient>['api'], M, P>

export type ApiQueryParametersByAlias<A extends string> =
  ZodiosQueryParamsByAlias<ReturnType<typeof createApiClient>['api'], A>
