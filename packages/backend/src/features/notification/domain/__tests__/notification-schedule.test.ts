import { describe, it, expect } from "vitest"
import { calculateNextNotificationTime } from "../notification-schedule"

describe("calculateNextNotificationTime", () => {
  it("今日の次の時刻を選択", () => {
    const digestTimes = ["18:00", "18:30"]
    const timezone = "Asia/Tokyo"
    // 2025-10-16 17:30 JST
    const currentTime = new Date("2025-10-16T08:30:00Z") // UTC = JST - 9h

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: 2025-10-16 18:00 JST = 2025-10-16 09:00 UTC
    const expected = new Date("2025-10-16T09:00:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })

  it("今日の最後の時刻も過ぎている場合は翌日の最初の時刻", () => {
    const digestTimes = ["18:00", "18:30"]
    const timezone = "Asia/Tokyo"
    // 2025-10-16 19:00 JST
    const currentTime = new Date("2025-10-16T10:00:00Z")

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: 2025-10-17 18:00 JST = 2025-10-17 09:00 UTC
    const expected = new Date("2025-10-17T09:00:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })

  it("深夜0時跨ぎのケース", () => {
    const digestTimes = ["00:10", "06:00"]
    const timezone = "Asia/Tokyo"
    // 2025-10-16 23:50 JST
    const currentTime = new Date("2025-10-16T14:50:00Z")

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: 2025-10-17 00:10 JST = 2025-10-16 15:10 UTC
    const expected = new Date("2025-10-16T15:10:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })

  it("タイムゾーンが異なる場合", () => {
    const digestTimes = ["18:00"]
    const timezone = "America/New_York"
    // 2025-10-16 17:00 EDT (UTC-4) - October is in EDT
    const currentTime = new Date("2025-10-16T21:00:00Z")

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: 2025-10-16 18:00 EDT = 2025-10-16 22:00 UTC
    const expected = new Date("2025-10-16T22:00:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })

  it("設定が空の場合はデフォルト時刻", () => {
    const digestTimes: string[] = []
    const timezone = "Asia/Tokyo"
    // 2025-10-16 17:30 JST
    const currentTime = new Date("2025-10-16T08:30:00Z")

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: デフォルト時刻 18:00 JST = 2025-10-16 09:00 UTC
    const expected = new Date("2025-10-16T09:00:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })

  it("複数の通知時刻から現在時刻より後の最初の時刻を選択", () => {
    const digestTimes = ["18:00", "18:30", "19:00"]
    const timezone = "Asia/Tokyo"
    // 2025-10-16 18:15 JST
    const currentTime = new Date("2025-10-16T09:15:00Z")

    const result = calculateNextNotificationTime(
      digestTimes,
      timezone,
      currentTime,
    )

    // Expected: 2025-10-16 18:30 JST = 2025-10-16 09:30 UTC
    const expected = new Date("2025-10-16T09:30:00Z")
    expect(result.getTime()).toBe(expected.getTime())
  })
})
