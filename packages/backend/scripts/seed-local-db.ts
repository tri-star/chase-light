#!/usr/bin/env tsx

import { fileURLToPath } from "url"
import { resolve } from "path"
import { eq } from "drizzle-orm"
import { uuidv7 } from "uuidv7"
import { TEST_USERS } from "shared"
import { connectDb, db, disconnectDb } from "../src/db/connection"
import { users } from "../src/db/schema"
import {
  TEST_DATA_SOURCES,
  createDataSource,
  createUserWatch,
  type TestDataSourceDefinition,
} from "../src/features/data-sources/domain/factories/data-source-factory"
import type { DataSource } from "../src/features/data-sources/domain"
import {
  DrizzleDataSourceRepository,
  DrizzleUserWatchRepository,
} from "../src/features/data-sources/infra/repositories"
import { createActivity } from "../src/features/activities/domain/factories/activity-factory"
import type { Activity } from "../src/features/activities/domain"
import { DrizzleActivityRepository } from "../src/features/detection/infra/repositories"
import { toDetectTargetId } from "../src/features/detection/domain/detect-target"
import { createNotificationDraft } from "../src/features/notification/domain/factories/notification-factory"
import { DrizzleDigestNotificationRepository } from "../src/features/notification/infra/repositories/drizzle-digest-notification.repository"

type SeedUser = {
  id: string
  auth0UserId: string
}

type SeededDataSource = {
  definition: TestDataSourceDefinition
  record: DataSource
}

const DISALLOWED_ENV_VALUES = new Set(["production"])

function ensureNotProduction(): void {
  const indicators: Array<{ name: string; value?: string }> = [
    { name: "NODE_ENV", value: process.env.NODE_ENV },
    { name: "APP_ENV", value: process.env.APP_ENV },
    { name: "VERCEL_ENV", value: process.env.VERCEL_ENV },
  ]

  for (const indicator of indicators) {
    if (indicator.value && DISALLOWED_ENV_VALUES.has(indicator.value)) {
      throw new Error(
        `Seeding script is disabled in production environments (${indicator.name}=${indicator.value})`,
      )
    }
  }
}

async function ensureTestUserExists(user: (typeof TEST_USERS)[number]) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.auth0UserId, user.id))
    .limit(1)

  if (existing.length > 0) {
    return { id: existing[0].id, auth0UserId: user.id }
  }

  const now = new Date()
  const userId = uuidv7()
  await db.insert(users).values({
    id: userId,
    auth0UserId: user.id,
    email: user.email,
    name: user.name,
    githubUsername: user.githubUsername,
    avatarUrl: user.avatarUrl,
    timezone: "Asia/Tokyo",
    createdAt: now,
    updatedAt: now,
  })

  return { id: userId, auth0UserId: user.id }
}

async function prepareUsers(): Promise<SeedUser[]> {
  const results: SeedUser[] = []

  for (const user of TEST_USERS) {
    const seeded = await ensureTestUserExists(user)
    results.push(seeded)
  }

  return results
}

async function seedDataSources(): Promise<SeededDataSource[]> {
  const repository = new DrizzleDataSourceRepository()
  const seeded: SeededDataSource[] = []

  for (const definition of TEST_DATA_SOURCES) {
    const seed = createDataSource(definition)
    const record = await repository.save(seed)
    seeded.push({ definition, record })
  }

  return seeded
}

async function seedUserWatches(
  usersToSeed: SeedUser[],
  dataSources: SeededDataSource[],
): Promise<void> {
  const repository = new DrizzleUserWatchRepository()

  for (const user of usersToSeed) {
    for (const { record } of dataSources) {
      const seed = createUserWatch(user.id, record.id)
      await repository.save(seed)
    }
  }
}

async function seedActivities(
  dataSources: SeededDataSource[],
): Promise<Activity[]> {
  const repository = new DrizzleActivityRepository()
  const activities: Activity[] = []

  for (const { record } of dataSources) {
    const count = 5 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i += 1) {
      const seed = createActivity(record.id)
      const upserted = await repository.upsert({
        id: seed.id,
        detectTargetId: toDetectTargetId(record.id),
        githubEventId: seed.githubEventId,
        activityType: seed.activityType,
        title: seed.title,
        body: seed.body,
        translatedTitle: seed.translatedTitle,
        summary: seed.summary,
        translatedBody: seed.translatedBody,
        version: seed.version,
        status: seed.status,
        statusDetail: seed.statusDetail,
        githubData: seed.githubData,
        createdAt: seed.createdAt,
      })

      activities.push({
        ...seed,
        id: upserted.id,
      })
    }
  }

  return activities
}

async function seedNotifications(
  usersToSeed: SeedUser[],
  activities: Activity[],
  dataSources: SeededDataSource[],
): Promise<void> {
  if (activities.length === 0) {
    return
  }

  const repository = new DrizzleDigestNotificationRepository()
  const sortedActivities = [...activities].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
  const dataSourceMap = new Map(
    dataSources.map(({ record, definition }) => [
      record.id,
      {
        name: definition.name,
        fullName: record.repository.fullName ?? definition.fullName,
      },
    ]),
  )

  for (const user of usersToSeed) {
    const drafts = chunk(sortedActivities, 5).map((chunked) =>
      createNotificationDraft(user.id, chunked, dataSourceMap),
    )
    await repository.createMany(drafts)
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function main() {
  try {
    ensureNotProduction()
    await connectDb()

    console.log("🧑‍💻 Seeding test users...")
    const seededUsers = await prepareUsers()

    console.log("📦 Seeding data sources...")
    const dataSources = await seedDataSources()

    console.log("👀 Seeding user watches...")
    await seedUserWatches(seededUsers, dataSources)

    console.log("📝 Seeding activities...")
    const activities = await seedActivities(dataSources)

    console.log("🔔 Seeding notifications...")
    await seedNotifications(seededUsers, activities, dataSources)

    console.log(
      `✅ Seed completed: ${dataSources.length} data sources, ${activities.length} activities`,
    )
  } catch (error) {
    console.error("❌ Failed to seed local database.")
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  } finally {
    await disconnectDb()
  }
}

const scriptPath = resolve(fileURLToPath(import.meta.url))
const executedPath = resolve(process.argv[1])

if (scriptPath === executedPath) {
  main()
}
