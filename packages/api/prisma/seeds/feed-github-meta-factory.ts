import { defineFeedGitHubMetaFactory } from '@/__generated__/fabbrica'
import { FeedFactory } from 'prisma/seeds/feed-factory'
import { v7 as uuidv7 } from 'uuid'

export const FeedGitHubMetaFactory = defineFeedGitHubMetaFactory({
  defaultData: async () => ({
    id: uuidv7(),
    lastReleaseDate: null,
    feed: FeedFactory,
  }),
})
