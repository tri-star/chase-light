import { describe, expect, test, vi } from "vitest"
import {
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
  NOTIFICATIONS_MIN_LIMIT,
  NOTIFICATIONS_READ_FILTER,
} from "../../../constants/query.constants"
import type { NotificationQueryRepository } from "../../../domain/repositories/notification-query.repository"
import type {
  NotificationListItem,
  NotificationListResult,
} from "../../../domain/notification-query"
import { ListNotificationsUseCase } from "../list-notifications.use-case"
import { NotificationInvalidCursorError } from "../../../errors/notification-invalid-cursor.error"

const createListResult = (
  overrides: Partial<NotificationListResult> = {},
): NotificationListResult => ({
  items: overrides.items ?? ([] as NotificationListItem[]),
  pageInfo: {
    hasNext: overrides.pageInfo?.hasNext ?? false,
    nextCursor: overrides.pageInfo?.nextCursor,
  },
})

describe("ListNotificationsUseCase", () => {
  const createRepository = () => {
    return {
      list: vi.fn<NotificationQueryRepository["list"]>(),
      findById: vi.fn(),
    }
  }

  test("デフォルト値で通知一覧を取得し、nextCursorをBase64で返す", async () => {
    const repository = createRepository()
    repository.list.mockResolvedValue(
      createListResult({
        items: [
          {
            notification: {
              id: "notif-1",
              type: "activity_digest",
              status: "pending",
              isRead: false,
              scheduledAt: new Date("2025-10-25T10:00:00Z"),
              sentAt: null,
              createdAt: new Date("2025-10-25T09:00:00Z"),
              updatedAt: new Date("2025-10-25T09:05:00Z"),
              lastActivityOccurredAt: new Date("2025-10-25T08:30:00Z"),
              metadata: null,
            },
            dataSources: [],
          },
        ],
        pageInfo: {
          hasNext: true,
          nextCursor: {
            notificationId: "notif-1",
            lastActivityOccurredAt: new Date("2025-10-25T08:30:00Z"),
          },
        },
      }),
    )

    const useCase = new ListNotificationsUseCase(repository)
    const result = await useCase.execute({ userId: "user-1" })

    expect(repository.list).toHaveBeenCalledWith({
      userId: "user-1",
      limit: NOTIFICATIONS_DEFAULT_LIMIT,
      cursor: undefined,
      readFilter: NOTIFICATIONS_READ_FILTER.ALL,
      search: undefined,
    })

    expect(result.pageInfo.hasNext).toBe(true)
    expect(result.pageInfo.nextCursor).toMatch(/=/)
  })

  test("limitを上限値に丸める", async () => {
    const repository = createRepository()
    repository.list.mockResolvedValue(createListResult())

    const useCase = new ListNotificationsUseCase(repository)
    await useCase.execute({ userId: "user-1", limit: 999 })

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: NOTIFICATIONS_MAX_LIMIT }),
    )
  })

  test("limitが下限未満の場合は下限に丸める", async () => {
    const repository = createRepository()
    repository.list.mockResolvedValue(createListResult())

    const useCase = new ListNotificationsUseCase(repository)
    await useCase.execute({ userId: "user-1", limit: 0 })

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: NOTIFICATIONS_MIN_LIMIT }),
    )
  })

  test("不正なカーソルはNotificationInvalidCursorErrorを投げる", async () => {
    const repository = createRepository()
    repository.list.mockResolvedValue(createListResult())

    const useCase = new ListNotificationsUseCase(repository)

    await expect(
      useCase.execute({ userId: "user-1", cursor: "invalid" }),
    ).rejects.toBeInstanceOf(NotificationInvalidCursorError)
  })
})
