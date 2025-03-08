import { defineFeedLogFactory } from '@/__generated__/fabbrica'
import { fakerJA as faker } from '@faker-js/faker'
import type { FeedLogStatus } from '@prisma/client'
import { FEED_LOG_STATUS_VALUES } from 'core/features/feed/feed-logs'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { v7 as uuidv7 } from 'uuid'

export const FeedLogFactory = defineFeedLogFactory({
  defaultData: async () => ({
    id: uuidv7(),
    feed: FeedFactory,
    status: faker.helpers.arrayElement(
      FEED_LOG_STATUS_VALUES satisfies FeedLogStatus[],
    ),
    date: faker.date.recent(),
    summary: '',
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  }),
})
