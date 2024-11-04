import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import { execSync } from "child_process"
import type { GlobalSetupContext } from "vitest/node"

let postgresContainer: StartedPostgreSqlContainer | undefined
let connectionUrl: string | undefined

export async function setup({ provide }: GlobalSetupContext) {
  console.log("Start DB container.")
  postgresContainer = await new PostgreSqlContainer().start()
  connectionUrl = postgresContainer.getConnectionUri()
  console.log("DB container started.", connectionUrl)

  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma migrate dev --skip-generate`,
  )
  console.log("Migration done.", connectionUrl)

  console.log("Database initialized.")

  provide("testDbConnectUrl", connectionUrl)
}

export async function tearDown() {
  await postgresContainer?.stop()
  console.log("DB container stopped.")
}

declare module "vitest" {
  export interface ProvidedContext {
    testDbConnectUrl: string
  }
}
