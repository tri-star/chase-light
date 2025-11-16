#!/usr/bin/env tsx

import { fileURLToPath } from "url"
import { resolve } from "path"
import { eq } from "drizzle-orm"
import { uuidv7 } from "uuidv7"
import { connectDb, disconnectDb, db } from "../src/db/connection"
import { users } from "../src/db/schema"
import { TEST_USER_AUTH0_USER_ID_PREFIX } from "../../shared/src/constants/auth"

type SeedUserDefinition = {
  suffix: string
  name: string
  email: string
  githubUsername: string
  avatarUrl: string
}

const TEST_USERS: SeedUserDefinition[] = [
  {
    suffix: "01",
    name: "テストユーザー01",
    email: "test-user-01@example.com",
    githubUsername: "testuser01",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=1",
  },
  {
    suffix: "02",
    name: "テストユーザー02",
    email: "test-user-02@example.com",
    githubUsername: "testuser02",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=2",
  },
  {
    suffix: "03",
    name: "テストユーザー03",
    email: "test-user-03@example.com",
    githubUsername: "testuser03",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=3",
  },
]

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

async function ensureTestUserExists(
  user: SeedUserDefinition,
): Promise<"created" | "skipped"> {
  const auth0UserId = `${TEST_USER_AUTH0_USER_ID_PREFIX}${user.suffix}`
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.auth0UserId, auth0UserId))
    .limit(1)

  if (existing.length > 0) {
    console.log(`⚠️  User ${auth0UserId} already exists. Skipping creation.`)
    return "skipped"
  }

  const now = new Date()
  await db.insert(users).values({
    id: uuidv7(),
    auth0UserId,
    email: user.email,
    name: user.name,
    githubUsername: user.githubUsername,
    avatarUrl: user.avatarUrl,
    timezone: "Asia/Tokyo",
    createdAt: now,
    updatedAt: now,
  })
  console.log(`✅ Created test user ${auth0UserId}`)
  return "created"
}

async function seedTestUsers(): Promise<void> {
  let created = 0
  let skipped = 0

  for (const user of TEST_USERS) {
    const result = await ensureTestUserExists(user)
    if (result === "created") {
      created += 1
    } else {
      skipped += 1
    }
  }

  console.log(
    `Seeding completed. Created ${created} user(s), skipped ${skipped} existing user(s).`,
  )
}

async function main() {
  try {
    ensureNotProduction()
    await connectDb()
    await seedTestUsers()
  } catch (error) {
    console.error("❌ Failed to seed test users.")
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
