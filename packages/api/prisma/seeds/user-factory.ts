import { defineUserFactory } from "@/__generated__/fabbrica"
import { v7 as uuidv7 } from "uuid"
import { fakerJA as faker } from "@faker-js/faker"

export const UserFactory = defineUserFactory({
  defaultData: async () => ({
    id: uuidv7(),
    email: faker.internet.email(),
    accountName: faker.internet.username(),
    displayName: faker.person.fullName(),
    emailVerified: true,
    providerId: `github|${faker.number.int()}`,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  }),
})
