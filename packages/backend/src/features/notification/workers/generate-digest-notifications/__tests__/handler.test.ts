import { randomUUID } from "node:crypto"
import type { Context } from "aws-lambda"
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  setupComponentTest,
} from "../../../../../test"
import { handler } from "../handler"
import { db } from "../../../../../db/connection"
import { notifications, userWatches } from "../../../../../db/schema"
import {
  createActivity,
  createActivityNotification,
  createUserPreference,
} from "../../../../../db/factories"
import { TestDataFactory } from "../../../../../test/factories"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../activities/domain"
import { eq } from "drizzle-orm"

const lambdaContext = { awsRequestId: "test-request" } as Context

describe("generate-digest-notifications handler", () => {
  setupComponentTest()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-10-16T09:30:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("購読者に通知を作成する", async () => {
    const user = await TestDataFactory.createCustomUser({
      timezone: "Asia/Tokyo",
    })
    const dataSource = await TestDataFactory.createTestDataSource({
      sourceId: "owner/repo",
      name: "owner/repo",
    })

    await createUserPreference({
      userId: user.id,
      timezone: "Asia/Tokyo",
      digestTimezone: "Asia/Tokyo",
      digestDeliveryTimes: ["18:00"],
    })

    await db.insert(userWatches).values({
      id: randomUUID(),
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: true,
      addedAt: new Date("2025-10-15T00:00:00Z"),
    })

    const activity = await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      title: "Release v1.0.0",
      occurredAt: new Date("2025-10-16T08:00:00Z"),
      updatedAt: new Date("2025-10-16T08:00:00Z"),
    })

    const result = await handler({ limit: 10 }, lambdaContext)

    expect(result.created).toBe(1)
    expect(result.skippedByConflict).toBe(0)
    expect(result.totalExamined).toBe(1)
    expect(result.lastProcessedActivityId).toBe(activity.id)

    const records = await db
      .select()
      .from(notifications)
      .where(eq(notifications.activityId, activity.id))

    expect(records).toHaveLength(1)
    const [record] = records
    expect(record.metadata).toMatchObject({
      activityType: ACTIVITY_TYPE.RELEASE,
      dataSourceId: dataSource.id,
      dataSourceName: "owner/repo",
      scheduledSlot: "18:00",
      digestTimezone: "Asia/Tokyo",
    })
  })

  it("ウォッチ対象外のアクティビティはスキップする", async () => {
    const user = await TestDataFactory.createCustomUser({
      timezone: "Asia/Tokyo",
    })
    const dataSource = await TestDataFactory.createTestDataSource()

    await db.insert(userWatches).values({
      id: randomUUID(),
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: true,
      watchReleases: false,
      watchIssues: true,
      watchPullRequests: true,
      addedAt: new Date("2025-10-15T00:00:00Z"),
    })

    await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      occurredAt: new Date("2025-10-16T08:00:00Z"),
      updatedAt: new Date("2025-10-16T08:00:00Z"),
    })

    const result = await handler({}, lambdaContext)

    expect(result.created).toBe(0)
    expect(result.totalExamined).toBe(0)
  })

  it("dryRunの場合は通知を作成しない", async () => {
    const user = await TestDataFactory.createCustomUser({
      timezone: "Asia/Tokyo",
    })
    const dataSource = await TestDataFactory.createTestDataSource()

    await db.insert(userWatches).values({
      id: randomUUID(),
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: true,
      addedAt: new Date("2025-10-15T00:00:00Z"),
    })

    const activity = await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      occurredAt: new Date("2025-10-16T08:00:00Z"),
      updatedAt: new Date("2025-10-16T08:00:00Z"),
    })

    const result = await handler({ dryRun: true }, lambdaContext)

    expect(result.created).toBe(0)
    expect(result.skippedByConflict).toBe(0)

    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.activityId, activity.id))

    expect(existing).toHaveLength(0)
  })

  it("既存通知がある場合は競合としてカウントする", async () => {
    const user = await TestDataFactory.createCustomUser({
      timezone: "Asia/Tokyo",
    })
    const dataSource = await TestDataFactory.createTestDataSource()

    await db.insert(userWatches).values({
      id: randomUUID(),
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: true,
      addedAt: new Date("2025-10-15T00:00:00Z"),
    })

    const activity = await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      occurredAt: new Date("2025-10-16T08:00:00Z"),
      updatedAt: new Date("2025-10-16T08:00:00Z"),
    })

    await createActivityNotification({
      activityId: activity.id,
      userId: user.id,
    })

    const result = await handler({}, lambdaContext)

    expect(result.created).toBe(0)
    expect(result.skippedByConflict).toBe(0)

    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.activityId, activity.id))

    expect(existing).toHaveLength(1)
  })
})
