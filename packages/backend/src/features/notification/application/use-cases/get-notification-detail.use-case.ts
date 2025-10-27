import type { NotificationListItem } from "../../domain/notification-query"
import type { NotificationQueryRepository } from "../../domain/repositories/notification-query.repository"

export type GetNotificationDetailInput = {
  userId: string
  notificationId: string
}

export class GetNotificationDetailUseCase {
  constructor(
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async execute(
    input: GetNotificationDetailInput,
  ): Promise<NotificationListItem | null> {
    return await this.notificationQueryRepository.findById({
      userId: input.userId,
      notificationId: input.notificationId,
    })
  }
}
