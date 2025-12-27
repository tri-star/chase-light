import { faker, fakerJA } from '@faker-js/faker'
import type { ActivityDetail } from '../activity'

export type ActivityDetailSeed = ActivityDetail

export function createActivity(
  override: Partial<ActivityDetail> = {}
): ActivityDetailSeed {
  const now = new Date()
  const repositoryFullName = `${faker.internet.username()}/${faker.internet.username()}`

  const base: ActivityDetail = {
    id: faker.string.uuid(),
    activityType: faker.helpers.arrayElement<ActivityDetail['activityType']>([
      'release',
      'issue',
      'pull_request',
    ]),
    title: faker.lorem.sentence(),
    translatedTitle: fakerJA.lorem.sentence(),
    summary: fakerJA.lorem.sentence({ min: 10, max: 100 }),
    detail: faker.lorem.paragraphs({ min: 2, max: 6 }),
    translatedBody: fakerJA.lorem.paragraphs({ min: 2, max: 6 }),
    bodyTranslationStatus: 'completed',
    status: 'completed',
    statusDetail: null,
    version: createVersion(),
    occurredAt: new Date(now.getTime() - 86400000).toISOString(),
    lastUpdatedAt: now.toISOString(),
    source: {
      id: faker.string.uuid(),
      sourceType: 'github_repository',
      name: repositoryFullName,
      url: `https://github.com/${repositoryFullName}`,
      metadata: {
        repositoryFullName,
        repositoryLanguage: faker.helpers.arrayElement([
          'TypeScript',
          'JavaScript',
          'Go',
          'Python',
          'Rust',
        ]),
        starsCount: faker.number.int({ min: 10, max: 200000 }),
        forksCount: faker.number.int({ min: 1, max: 50000 }),
        openIssuesCount: faker.number.int({ min: 0, max: 5000 }),
      },
    },
  }

  return {
    ...base,
    ...override,
    source: mergeSource(base.source, override.source),
  }
}

function createVersion(): string {
  const major = faker.number.int({ min: 0, max: 5 })
  const minor = faker.number.int({ min: 0, max: 20 })
  const patch = faker.number.int({ min: 0, max: 50 })
  return `v${major}.${minor}.${patch}`
}

function mergeSource(
  base: ActivityDetail['source'],
  override?: ActivityDetail['source']
): ActivityDetail['source'] {
  if (!override) return base

  return {
    ...base,
    ...override,
    metadata: {
      ...base.metadata,
      ...override.metadata,
    },
  }
}
