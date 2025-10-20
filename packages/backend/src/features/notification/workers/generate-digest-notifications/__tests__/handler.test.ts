import type { Context } from "aws-lambda"
import { eq } from "drizzle-orm"
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  setupComponentTest,
} from "../../../../../test"
import { db } from "../../../../../db/connection"
import {
  createActivity,
  createUserPreference,
  createUserWatch,
} from "../../../../../db/factories"
import {
  notificationDigestEntries,
  notificationDigestUserStates,
  notifications,
} from "../../../../../db/schema"
import { TestDataFactory } from "../../../../../test/factories"
import { handler } from "../handler"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../activities/domain"
import {
  createDigestGroupId,
  DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER,
} from "../../../domain"

const lambdaContext = { awsRequestId: "test-request" } as Context

describe("generate-digest-notifications handler", () => {
  setupComponentTest()

  beforeEach(() => {
    process.env.NOTIFICATION_SUMMARIZATION_ADAPTER = "stub"
  })

  afterEach(() => {
    delete process.env.NOTIFICATION_SUMMARIZATION_ADAPTER
    delete process.env.NOTIFICATION_SUMMARIZATION_SKIP_GROUPS
    delete process.env.NOTIFICATION_SUMMARIZATION_FALLBACK_GROUPS
  })

  it("集約対象があるユーザーにダイジェスト通知を作成する", async () => {
    const user = await TestDataFactory.createCustomUser({
      timezone: "Asia/Tokyo",
    })
    await createUserPreference({
      userId: user.id,
      digestEnabled: true,
      digestTimezone: "Asia/Tokyo",
    })

    const dataSource = await TestDataFactory.createTestDataSource({
      name: "owner/repo",
      sourceId: "owner/repo",
    })

    await createUserWatch({
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: false,
      watchPullRequests: false,
    })

    await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      title: "Release v1.0.0",
      occurredAt: new Date("2025-10-20T09:00:00Z"),
      updatedAt: new Date("2025-10-20T09:00:00Z"),
    })

    await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      title: "Release v1.1.0",
      occurredAt: new Date("2025-10-20T10:00:00Z"),
      updatedAt: new Date("2025-10-20T10:00:00Z"),
    })

    const result = await handler({ limit: 10 }, lambdaContext)

    expect(result.created).toBe(1)
    expect(result.skippedByConflict).toBe(0)
    expect(result.processedUsers).toBe(1)
    expect(result.totalExamined).toBe(2)
    expect(result.windowSummaries).toHaveLength(1)
    expect(result.windowSummaries[0]).toMatchObject({
      userId: user.id,
      activityCount: 2,
      notificationCreated: true,
      fallbackGroups: 0,
    })

    const notificationsForUser = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))

    expect(notificationsForUser).toHaveLength(1)
    const notification = notificationsForUser[0]
    expect(notification.message).toBe(DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER)
    const metadata = notification.metadata as {
      digest: {
        activityCount: number
        groups: Array<{ activityIds: string[] }>
        range: { from: string; to: string; timezone: string }
        generatorStats: Array<{ type: string }>
      }
    }
    expect(metadata.digest.activityCount).toBe(2)
    expect(metadata.digest.groups[0].activityIds).toHaveLength(2)
    expect(metadata.digest.generatorStats[0].type).toBe("ai")

    const entries = await db
      .select()
      .from(notificationDigestEntries)
      .where(eq(notificationDigestEntries.notificationId, notification.id))

    expect(entries).toHaveLength(2)
    entries.forEach((entry, index) => {
      expect(entry.generator).toBe("ai")
      expect(entry.position).toBe(index)
    })

    const state = await db
      .select()
      .from(notificationDigestUserStates)
      .where(eq(notificationDigestUserStates.userId, user.id))

    expect(state).toHaveLength(1)
    expect(state[0].lastSuccessfulRunAt).not.toBeNull()
  })

  it("dryRun の場合は通知を作成せず、状態も更新しない", async () => {
    const user = await TestDataFactory.createCustomUser({})
    const dataSource = await TestDataFactory.createTestDataSource()

    await createUserPreference({ userId: user.id, digestEnabled: true })
    await createUserWatch({ userId: user.id, dataSourceId: dataSource.id })
    await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
    })

    const result = await handler({ limit: 5, dryRun: true }, lambdaContext)

    expect(result.created).toBe(0)
    expect(result.skippedByConflict).toBe(0)

    const notificationsForUser = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))

    expect(notificationsForUser).toHaveLength(0)

    const states = await db
      .select()
      .from(notificationDigestUserStates)
      .where(eq(notificationDigestUserStates.userId, user.id))

    expect(states).toHaveLength(0)
  })

  it("Summarization がスキップされたグループはフォールバックする", async () => {
    const user = await TestDataFactory.createCustomUser({})
    await createUserPreference({ userId: user.id, digestEnabled: true })
    const dataSource = await TestDataFactory.createTestDataSource({
      sourceId: "example/repo",
      name: "example/repo",
    })

    await createUserWatch({
      userId: user.id,
      dataSourceId: dataSource.id,
      watchReleases: true,
      watchIssues: false,
      watchPullRequests: false,
    })

    const activity = await createActivity({
      dataSourceId: dataSource.id,
      activityType: ACTIVITY_TYPE.RELEASE,
      status: ACTIVITY_STATUS.COMPLETED,
      title: "Release v2.0.0",
    })

    const groupId = createDigestGroupId(dataSource.id, ACTIVITY_TYPE.RELEASE)
    process.env.NOTIFICATION_SUMMARIZATION_SKIP_GROUPS = groupId

    const result = await handler({ limit: 5 }, lambdaContext)

    expect(result.created).toBe(1)
    expect(result.windowSummaries[0].fallbackGroups).toBe(1)

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))

    expect(notification).toBeTruthy()
    const entries = await db
      .select()
      .from(notificationDigestEntries)
      .where(eq(notificationDigestEntries.notificationId, notification.id))

    expect(entries).toHaveLength(1)
    expect(entries[0].activityId).toBe(activity.id)
    expect(entries[0].generator).toBe("fallback")

    const metadata = notification.metadata as {
      digest: { generatorStats: Array<{ type: string }> }
    }
    expect(metadata.digest.generatorStats[0].type).toBe("fallback")
  })
})
