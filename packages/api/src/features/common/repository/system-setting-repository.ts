import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { v7 as uuidv7 } from 'uuid'

export interface SystemSettingModel {
  id: string
  lastNotificationRunDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export class SystemSettingRepository {
  async findSystemSetting(): Promise<SystemSettingModel | null> {
    const prisma = getPrismaClientInstance()

    const systemSetting = await prisma.systemSetting.findFirst()
    return systemSetting
  }

  async getOrCreateSystemSetting(): Promise<SystemSettingModel> {
    const prisma = getPrismaClientInstance()

    const systemSetting = await this.findSystemSetting()
    if (systemSetting) {
      return systemSetting
    }

    return await prisma.systemSetting.create({
      data: {
        id: uuidv7(),
        lastNotificationRunDate: null,
      },
    })
  }

  async updateLastNotificationRunDate(date: Date): Promise<void> {
    const prisma = getPrismaClientInstance()
    const systemSetting = await this.getOrCreateSystemSetting()

    await prisma.systemSetting.update({
      where: {
        id: systemSetting.id,
      },
      data: {
        lastNotificationRunDate: date,
      },
    })
  }
}
