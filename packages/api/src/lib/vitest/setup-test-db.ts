import { initialize } from "@/__generated__/fabbrica"
import { swapPrismaClientForTest } from "@/lib/prisma/app-prisma-client"
import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"
import { beforeEach, inject } from "vitest"

beforeEach(() => {
  const connectionUrl = inject("testDbConnectUrl")

  const prismaClientForTest = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })

  prismaClientForTest.$on("query", (e) => {
    console.log("Query: ", e)
  })

  swapPrismaClientForTest(prismaClientForTest)

  initialize({ prisma: prismaClientForTest })

  console.log("before each: Start DB reset.")
  execSync(
    `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} pnpx prisma migrate reset --force`,
  )
})
