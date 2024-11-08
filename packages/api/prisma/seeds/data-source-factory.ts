import { defineDataSourceFactory } from "@/__generated__/fabbrica"
import { faker } from "@faker-js/faker"
import { v7 as uuidv7 } from "uuid"

export const DataSourceFactory = defineDataSourceFactory({
  defaultData: async () => ({
    id: uuidv7(),
    name: faker.book.title(),
    url: faker.internet.url(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  }),
})
