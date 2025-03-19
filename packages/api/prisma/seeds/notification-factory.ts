import { defineNotificationFactory } from '@/__generated__/fabbrica'
import { v7 as uuidv7 } from 'uuid'
import { fakerJA as faker } from '@faker-js/faker'
import { UserFactory } from 'prisma/seeds/user-factory'

export const NotificationFactory = defineNotificationFactory({
  defaultData: async () => ({
    id: uuidv7(),
    createdAt: faker.date.recent(),
    title: faker.lorem.sentence(),
    user: UserFactory,
  }),
})
