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
