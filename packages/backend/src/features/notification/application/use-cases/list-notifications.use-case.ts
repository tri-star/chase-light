import { Buffer } from "node:buffer"

import {
  NOTIFICATIONS_CURSOR_DELIMITER,
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_MAX_LIMIT,
  NOTIFICATIONS_MIN_LIMIT,
  NOTIFICATIONS_READ_FILTER,
  type NotificationReadFilter,
} from "../../constants/query.constants"
import type {
  NotificationListItem,
  NotificationListQuery,
  NotificationListResult,
} from "../../domain/notification-query"
import type { NotificationQueryRepository } from "../../domain/repositories/notification-query.repository"
import { NotificationInvalidCursorError } from "../../errors/notification-invalid-cursor.error"

export type ListNotificationsInput = {
  userId: string
  cursor?: string
  limit?: number
  read?: NotificationReadFilter
  search?: string
}

export type ListNotificationsOutput = {
  items: NotificationListItem[]
  pageInfo: {
    hasNext: boolean
    nextCursor?: string
  }
}

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async execute(
    input: ListNotificationsInput,
  ): Promise<ListNotificationsOutput> {
    const limit = this.normalizeLimit(input.limit)
    const readFilter = input.read ?? NOTIFICATIONS_READ_FILTER.ALL

    const cursor = input.cursor ? this.decodeCursor(input.cursor) : undefined

    const query: NotificationListQuery = {
      userId: input.userId,
      limit,
      cursor,
      readFilter,
      search: input.search,
    }

    const result = await this.notificationQueryRepository.list(query)

    return this.mapResult(result)
  }

  private normalizeLimit(limit?: number): number {
    if (typeof limit !== "number" || Number.isNaN(limit)) {
      return NOTIFICATIONS_DEFAULT_LIMIT
    }

    if (limit < NOTIFICATIONS_MIN_LIMIT) {
      return NOTIFICATIONS_MIN_LIMIT
    }

    if (limit > NOTIFICATIONS_MAX_LIMIT) {
      return NOTIFICATIONS_MAX_LIMIT
    }

    return Math.trunc(limit)
  }

  private decodeCursor(cursor: string) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8")
      const [timestamp, notificationId] = decoded.split(
        NOTIFICATIONS_CURSOR_DELIMITER,
      )

      if (!timestamp || !notificationId) {
        throw new NotificationInvalidCursorError()
      }

      const parsedDate = new Date(timestamp)

      if (Number.isNaN(parsedDate.getTime())) {
        throw new NotificationInvalidCursorError()
      }

      return {
        lastActivityOccurredAt: parsedDate,
        notificationId,
      }
    } catch (error) {
      if (error instanceof NotificationInvalidCursorError) {
        throw error
      }

      throw new NotificationInvalidCursorError(
        error instanceof Error
          ? error.message
          : NOTIFICATIONS_ERROR.INVALID_CURSOR,
      )
    }
  }

  private encodeCursor(
    cursor: NonNullable<NotificationListResult["pageInfo"]["nextCursor"]>,
  ) {
    const payload = `${cursor.lastActivityOccurredAt.toISOString()}${NOTIFICATIONS_CURSOR_DELIMITER}${cursor.notificationId}`
    return Buffer.from(payload).toString("base64")
  }

  private mapResult(result: NotificationListResult): ListNotificationsOutput {
    const nextCursor = result.pageInfo.nextCursor
      ? this.encodeCursor(result.pageInfo.nextCursor)
      : undefined

    return {
      items: result.items,
      pageInfo: {
        hasNext: result.pageInfo.hasNext,
        ...(nextCursor ? { nextCursor } : {}),
      },
    }
  }
}
