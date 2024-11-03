import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import { execSync } from "child_process"
import { afterAll, beforeAll, beforeEach } from "vitest"
import { PrismaClient } from "@prisma/client"
import { swapPrismaClientForTest } from "@/lib/prisma/app-prisma-client"

let postgresContainer: StartedPostgreSqlContainer | undefined
let connectionUrl: string | undefined

beforeAll(async () => {
  console.log("Start DB container.")
  postgresContainer = await new PostgreSqlContainer().start()
  connectionUrl = postgresContainer.getConnectionUri()
  console.log("DB container started.", connectionUrl)

  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma generate`,
  )
  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma migrate dev --skip-generate`,
  )
  console.log("Migration done.", connectionUrl)
  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma migrate reset --force`,
  )

  const prismaClientForTest = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })
  swapPrismaClientForTest(prismaClientForTest)

  console.log("Database initialized.")
})

beforeEach(() => {
  console.log("before each: Start DB reset.")
  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma migrate reset --force`,
  )
})

afterAll(async () => {
  await postgresContainer?.stop()
  console.log("DB container stopped.")
})
