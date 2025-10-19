import { describe, expect, it } from "vitest"
import { DateTime } from "luxon"
import {
  calculateNextDigestSchedule,
  type NotificationScheduleParams,
} from "../notification-schedule.service"
import type { Recipient } from "../../recipient"

function buildRecipient(
  overrides: Partial<Recipient> = {},
  digestOverrides: Partial<Recipient["digest"]> = {},
): Recipient {
  return {
    id: "user-1",
    timezone: "Asia/Tokyo",
    digest: {
      enabled: true,
      times: ["09:00", "18:00"],
      timezone: null,
      ...digestOverrides,
    },
    channels: ["digest"],
    ...overrides,
  }
}

function buildParams(
  overrides: Partial<NotificationScheduleParams> = {},
): NotificationScheduleParams {
  return {
    recipient: buildRecipient(),
    activityCreatedAt: DateTime.fromISO("2025-10-16T08:30:00", {
      zone: "Asia/Tokyo",
    })
      .toUTC()
      .toJSDate(),
    now: DateTime.fromISO("2025-10-16T07:00:00", {
      zone: "Asia/Tokyo",
    })
      .toUTC()
      .toJSDate(),
    ...overrides,
  }
}

describe("NotificationScheduleService", () => {
  it("同日の次スロットを選択する", () => {
    const params = buildParams()

    const result = calculateNextDigestSchedule(params)

    expect(result.scheduledSlot).toBe("09:00")
    expect(
      DateTime.fromJSDate(result.scheduledAt, { zone: "utc" })
        .setZone("Asia/Tokyo")
        .toFormat("yyyy-MM-dd HH:mm"),
    ).toBe("2025-10-16 09:00")
  })

  it("全スロットが過去の場合は翌日の最初のスロットを返す", () => {
    const params = buildParams({
      now: DateTime.fromISO("2025-10-16T20:00:00", {
        zone: "Asia/Tokyo",
      })
        .toUTC()
        .toJSDate(),
    })

    const result = calculateNextDigestSchedule(params)

    expect(result.scheduledSlot).toBe("09:00")
    expect(
      DateTime.fromJSDate(result.scheduledAt, { zone: "utc" })
        .setZone("Asia/Tokyo")
        .toFormat("yyyy-MM-dd HH:mm"),
    ).toBe("2025-10-17 09:00")
  })

  it("タイムゾーンが異なるユーザーでも正しいスロットを計算する", () => {
    const recipient = buildRecipient(
      { timezone: "America/Los_Angeles" },
      { timezone: "America/Los_Angeles", times: ["08:00", "17:30"] },
    )
    const params = buildParams({
      recipient,
      activityCreatedAt: DateTime.fromISO("2025-10-16T15:00:00", {
        zone: "UTC",
      }).toJSDate(),
      now: DateTime.fromISO("2025-10-16T16:00:00", {
        zone: "UTC",
      }).toJSDate(),
    })

    const result = calculateNextDigestSchedule(params)

    expect(result.timezone).toBe("America/Los_Angeles")
    expect(result.scheduledSlot).toBe("17:30")
    expect(
      DateTime.fromJSDate(result.scheduledAt, { zone: "utc" })
        .setZone("America/Los_Angeles")
        .toFormat("yyyy-MM-dd HH:mm"),
    ).toBe("2025-10-16 17:30")
  })

  it("スロット設定が空の場合はデフォルト値を使用する", () => {
    const recipient = buildRecipient({}, { times: [] })
    const params = buildParams({ recipient })

    const result = calculateNextDigestSchedule(params)

    expect(result.scheduledSlot).toBe("18:00")
  })
})
