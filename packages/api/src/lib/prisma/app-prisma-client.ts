import { PrismaClient } from '@prisma/client'

let prismaClient: PrismaClient | undefined

export function getPrismaClientInstance() {
  if (!prismaClient) {
    prismaClient = new PrismaClient()
  }
  return prismaClient
}

export function swapPrismaClientForTest(newPrismaClient: PrismaClient) {
  prismaClient = newPrismaClient
}
