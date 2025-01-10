import { initialize } from '@/__generated__/fabbrica'
import { swapPrismaClientForTest } from '@/lib/prisma/app-prisma-client'
import { PrismaClient } from '@prisma/client'
import { beforeEach, inject } from 'vitest'

beforeEach(async () => {
  const connectionUrl = inject('testDbConnectUrl')

  const prismaClientForTest = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })

  prismaClientForTest.$on('query', (e: unknown) => {
    console.log('Query: ', e)
  })

  swapPrismaClientForTest(prismaClientForTest)

  initialize({ prisma: prismaClientForTest })

  console.log('before each: Start DB reset.')

  // https://www.prisma.io/docs/orm/prisma-client/queries/crud#deleting-all-data-with-raw-sql--truncate
  const tablenames = await prismaClientForTest.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prismaClientForTest.$executeRawUnsafe(
      `TRUNCATE TABLE ${tables} CASCADE;`,
    )
  } catch (error) {
    console.log({ error })
  }
})
