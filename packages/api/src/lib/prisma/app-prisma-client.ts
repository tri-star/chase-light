import { PrismaClient } from '@prisma/client'

let prismaClient: PrismaClient | undefined

export function getPrismaClientInstance() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })
  }
  return prismaClient
}

//FIXME: この関数は利用していないため、削除したい
export function swapPrismaClientForTest(newPrismaClient: PrismaClient) {
  prismaClient = newPrismaClient
}
