import { initialize } from '@/__generated__/fabbrica'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { beforeEach } from 'vitest'

beforeEach(async () => {
  if (!process.env.DATABASE_URL.match('test_db')) {
    throw new Error('テスト対象がテスト用DBではありません')
  }

  const prisma = getPrismaClientInstance()
  initialize({ prisma: prisma })

  console.time('reset tables')
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
  console.timeEnd('reset tables')
})
