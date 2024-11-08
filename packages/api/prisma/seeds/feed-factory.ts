import { defineFeedFactory } from "@/__generated__/fabbrica"
import { v7 as uuidv7 } from "uuid"
import { fakerJA as faker } from "@faker-js/faker"
import { CYCLE_VALUES } from "core/features/feed/feed"
import { UserFactory } from "prisma/seeds/user-factory"
import { DataSourceFactory } from "prisma/seeds/data-source-factory"

export const FeedFactory = defineFeedFactory({
  defaultData: async () => ({
    id: uuidv7(),
    cycle: faker.helpers.arrayElement(CYCLE_VALUES),
    dataSource: DataSourceFactory,
    name: faker.book.title(),
    user: UserFactory,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  }),
})
