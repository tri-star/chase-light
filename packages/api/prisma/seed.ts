import { initialize } from "@/__generated__/fabbrica"
import { getPrismaClientInstance } from "@/lib/prisma/app-prisma-client"
import { UserFactory } from "prisma/seeds/user-factory"

const prisma = getPrismaClientInstance()

initialize({ prisma })

async function seed() {
  console.log("Seeding users...")
  await UserFactory.createList(5)

  console.log("Seeding completed.")
}

seed()
