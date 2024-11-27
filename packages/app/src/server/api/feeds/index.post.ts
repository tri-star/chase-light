import { createSsrApiClient } from "~/lib/api/client"
import { FeedLog } from "~/features/feed/domain/feed-log"
import { schemas } from "~/lib/api/client.generated"

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)
  const parseResult = await readValidatedBody(event, (body) =>
    schemas.postFeeds_Body.safeParse(body),
  )
  if (!parseResult.success) {
    return {
      status: 400,
      body: parseResult.error.errors,
    }
  }

  const body = parseResult.data
  const response = await client.postFeeds(body)

  return response
})
