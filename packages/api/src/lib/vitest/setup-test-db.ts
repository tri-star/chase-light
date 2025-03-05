import { initialize } from '@/__generated__/fabbrica'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { execSync } from 'child_process'
import { beforeEach } from 'vitest'

let initialized = false

beforeEach(async () => {
  if (!initialized) {
    const connectionUrl = process.env.DATABASE_URL
    execSync(
      `DATABASE_URL=${connectionUrl} DIRECT_URL=${connectionUrl} npx prisma migrate dev --skip-generate`,
    )
    initialized = true
  }

  const prisma = getPrismaClientInstance()
  initialize({ prisma: prisma })

  console.log('before each: Start DB reset.')

  // https://www.prisma.io/docs/orm/prisma-client/queries/crud#deleting-all-data-with-raw-sql--truncate
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
})
