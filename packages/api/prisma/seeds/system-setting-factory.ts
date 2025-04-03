import { defineSystemSettingFactory } from '@/__generated__/fabbrica'
import { v7 as uuidv7 } from 'uuid'
import { fakerJA as faker } from '@faker-js/faker'

export const SystemSettingFactory = defineSystemSettingFactory({
  defaultData: async () => ({
    id: uuidv7(),
    lastNotificationRunDate: faker.date.recent(),
    createdAt: faker.date.recent(),
  }),
})
