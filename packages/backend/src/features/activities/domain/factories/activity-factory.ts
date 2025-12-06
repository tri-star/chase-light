import { faker, fakerJA } from "@faker-js/faker"
import { uuidv7 } from "uuidv7"
import {
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  ACTIVITY_BODY_TRANSLATION_STATUS,
  type Activity,
  type ActivityType,
} from "../activity"

export type ActivitySeed = Activity

export function createActivity(dataSourceId: string): ActivitySeed {
  const now = new Date()
  const activityType = faker.helpers.arrayElement<ActivityType>([
    ACTIVITY_TYPE.RELEASE,
    ACTIVITY_TYPE.ISSUE,
    ACTIVITY_TYPE.PULL_REQUEST,
  ])

  return {
    id: uuidv7(),
    dataSourceId,
    githubEventId: faker.number.int({ min: 100000, max: 999999 }).toString(),
    activityType,
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraphs({ min: 100, max: 400 }),
    translatedTitle: fakerJA.lorem.sentence(),
    summary: fakerJA.lorem.sentence({ min: 10, max: 100 }),
    translatedBody: fakerJA.lorem.paragraph({ min: 100, max: 400 }),
    version: createVersion(),
    bodyTranslationStatus: ACTIVITY_BODY_TRANSLATION_STATUS.NOT_REQUESTED,
    bodyTranslationRequestedAt: null,
    bodyTranslationStartedAt: null,
    bodyTranslationCompletedAt: null,
    bodyTranslationError: null,
    status: ACTIVITY_STATUS.COMPLETED,
    statusDetail: null,
    githubData: "",
    createdAt: now,
    updatedAt: now,
  }
}

function createVersion(): string {
  const major = faker.number.int({ min: 0, max: 5 })
  const minor = faker.number.int({ min: 0, max: 20 })
  const patch = faker.number.int({ min: 0, max: 50 })
  return `v${major}.${minor}.${patch}`
}
