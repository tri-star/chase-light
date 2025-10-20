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
import {
  notifications,
  userWatches,
  notificationActivities,
  userDigestExecutionLogs,
} from "../../../../../db/schema"
import {
  createActivity,
  createUserPreference,
} from "../../../../../db/factories"
import { TestDataFactory } from "../../../../../test/factories"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../../../../activities/domain"
import { eq, and } from "drizzle-orm"
import { WORKER_NAME_GENERATE_DIGEST } from "../../../constants/notification.constants"

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

  describe("正常系", () => {
    it("ユーザー単位でダイジェスト通知を作成する", async () => {
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
        digestEnabled: true,
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

      // 3つのアクティビティを作成
      const activity1 = await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release v1.0.0",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const activity2 = await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.1",
        body: "This is a release v1.0.1",
        occurredAt: new Date("2025-10-16T08:30:00Z"),
        updatedAt: new Date("2025-10-16T08:30:00Z"),
      })

      const activity3 = await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.ISSUE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Issue #1",
        body: "This is an issue",
        occurredAt: new Date("2025-10-16T09:00:00Z"),
        updatedAt: new Date("2025-10-16T09:00:00Z"),
      })

      const result = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(1)
      expect(result.successUsers).toBe(1)
      expect(result.failedUsers).toBe(0)
      expect(result.totalNotifications).toBe(1)
      expect(result.totalActivities).toBe(3)

      // ダイジェスト通知が作成されている
      const createdNotifications = await db.select().from(notifications)

      expect(createdNotifications).toHaveLength(1)
      const [notification] = createdNotifications

      expect(notification.userId).toBe(user.id)
      expect(notification.activityId).toBeNull()
      expect(notification.metadata).not.toBeNull()
      expect(notification.metadata).toMatchObject({
        scheduledSlot: "digest",
        digestTimezone: "Asia/Tokyo",
      })
      expect(notification.metadata?.digest).toBeDefined()

      // notification_activities に関連が記録されている
      const relatedActivities = await db
        .select()
        .from(notificationActivities)
        .where(eq(notificationActivities.notificationId, notification.id))

      expect(relatedActivities).toHaveLength(3)
      const activityIds = relatedActivities.map((r) => r.activityId).sort()
      expect(activityIds).toEqual(
        [activity1.id, activity2.id, activity3.id].sort(),
      )

      // user_digest_execution_logs が更新されている
      const executionLogs = await db
        .select()
        .from(userDigestExecutionLogs)
        .where(
          and(
            eq(userDigestExecutionLogs.userId, user.id),
            eq(userDigestExecutionLogs.workerName, WORKER_NAME_GENERATE_DIGEST),
          ),
        )

      expect(executionLogs).toHaveLength(1)
      const [log] = executionLogs
      expect(log.lastSuccessfulRunAt.getTime()).toBe(
        new Date("2025-10-16T09:30:00Z").getTime(),
      )
    })

    it("複数ユーザーを処理できる", async () => {
      const user1 = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const user2 = await TestDataFactory.createCustomUser({
        timezone: "America/New_York",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user1.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
      })

      await createUserPreference({
        userId: user2.id,
        timezone: "America/New_York",
        digestTimezone: "America/New_York",
        digestDeliveryTimes: ["09:00"],
        digestEnabled: true,
      })

      await db.insert(userWatches).values([
        {
          id: randomUUID(),
          userId: user1.id,
          dataSourceId: dataSource.id,
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: true,
          watchPullRequests: true,
          addedAt: new Date("2025-10-15T00:00:00Z"),
        },
        {
          id: randomUUID(),
          userId: user2.id,
          dataSourceId: dataSource.id,
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: true,
          watchPullRequests: true,
          addedAt: new Date("2025-10-15T00:00:00Z"),
        },
      ])

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const result = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(2)
      expect(result.successUsers).toBe(2)
      expect(result.failedUsers).toBe(0)
      expect(result.totalNotifications).toBe(2)
    })

    it("userIdsを指定した場合は指定ユーザーのみ処理する", async () => {
      const user1 = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const user2 = await TestDataFactory.createCustomUser({
        timezone: "America/New_York",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user1.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
      })

      await createUserPreference({
        userId: user2.id,
        timezone: "America/New_York",
        digestTimezone: "America/New_York",
        digestDeliveryTimes: ["09:00"],
        digestEnabled: true,
      })

      await db.insert(userWatches).values([
        {
          id: randomUUID(),
          userId: user1.id,
          dataSourceId: dataSource.id,
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: true,
          watchPullRequests: true,
          addedAt: new Date("2025-10-15T00:00:00Z"),
        },
        {
          id: randomUUID(),
          userId: user2.id,
          dataSourceId: dataSource.id,
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: true,
          watchPullRequests: true,
          addedAt: new Date("2025-10-15T00:00:00Z"),
        },
      ])

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const result = await handler(
        { userIds: [user1.id], useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(1)
      expect(result.successUsers).toBe(1)
      expect(result.totalNotifications).toBe(1)

      const createdNotifications = await db.select().from(notifications)
      expect(createdNotifications).toHaveLength(1)
      expect(createdNotifications[0]?.userId).toBe(user1.id)
    })
  })

  describe("エッジケース", () => {
    it("対象アクティビティがない場合は通知を作成しない", async () => {
      const user = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })

      await createUserPreference({
        userId: user.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
      })

      const result = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(1)
      expect(result.successUsers).toBe(1)
      expect(result.totalNotifications).toBe(0)
      expect(result.totalActivities).toBe(0)
    })

    it("ウォッチ設定で対象外のアクティビティは無視する", async () => {
      const user = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
      })

      await db.insert(userWatches).values({
        id: randomUUID(),
        userId: user.id,
        dataSourceId: dataSource.id,
        notificationEnabled: true,
        watchReleases: false, // RELEASEを監視しない
        watchIssues: true,
        watchPullRequests: true,
        addedAt: new Date("2025-10-15T00:00:00Z"),
      })

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const result = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(1)
      expect(result.successUsers).toBe(1)
      expect(result.totalNotifications).toBe(0)
      expect(result.totalActivities).toBe(0)
    })

    it("digestEnabledがfalseのユーザーは処理対象外", async () => {
      const user = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: false, // ダイジェストを無効化
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

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const result = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(0)
      expect(result.successUsers).toBe(0)
      expect(result.totalNotifications).toBe(0)
    })

    it("dryRunモードでは通知を作成しない", async () => {
      const user = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
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

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      const result = await handler(
        { dryRun: true, useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(1)
      expect(result.successUsers).toBe(1)
      expect(result.totalNotifications).toBe(0) // dryRunなので作成されない
      expect(result.totalActivities).toBe(1)

      const createdNotifications = await db.select().from(notifications)
      expect(createdNotifications).toHaveLength(0)

      // dryRunの場合はlastSuccessfulRunAtも更新されない
      const executionLogs = await db
        .select()
        .from(userDigestExecutionLogs)
        .where(eq(userDigestExecutionLogs.userId, user.id))

      expect(executionLogs).toHaveLength(0)
    })
  })

  describe("冪等性", () => {
    it("2回目の実行では新しいアクティビティのみ処理する", async () => {
      const user = await TestDataFactory.createCustomUser({
        timezone: "Asia/Tokyo",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user.id,
        timezone: "Asia/Tokyo",
        digestTimezone: "Asia/Tokyo",
        digestDeliveryTimes: ["18:00"],
        digestEnabled: true,
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

      // 最初のアクティビティ
      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      // 1回目の実行
      const result1 = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result1.totalNotifications).toBe(1)
      expect(result1.totalActivities).toBe(1)

      // 時間を進める
      vi.setSystemTime(new Date("2025-10-16T10:00:00Z"))

      // 新しいアクティビティを追加
      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.1",
        body: "This is another release",
        occurredAt: new Date("2025-10-16T09:40:00Z"),
        updatedAt: new Date("2025-10-16T09:40:00Z"),
      })

      // 2回目の実行
      const result2 = await handler(
        { useStubSummarization: true },
        lambdaContext,
      )

      expect(result2.totalNotifications).toBe(1)
      expect(result2.totalActivities).toBe(1) // 新しいアクティビティのみ

      const allNotifications = await db.select().from(notifications)
      expect(allNotifications).toHaveLength(2) // 合計2つ
    })
  })

  describe("エラーハンドリング", () => {
    it("1ユーザーのエラーが他のユーザーに影響しない", async () => {
      const user2 = await TestDataFactory.createCustomUser({
        timezone: "America/New_York",
      })
      const dataSource = await TestDataFactory.createTestDataSource()

      await createUserPreference({
        userId: user2.id,
        timezone: "America/New_York",
        digestTimezone: "America/New_York",
        digestDeliveryTimes: ["09:00"],
        digestEnabled: true,
      })

      await db.insert(userWatches).values({
        id: randomUUID(),
        userId: user2.id,
        dataSourceId: dataSource.id,
        notificationEnabled: true,
        watchReleases: true,
        watchIssues: true,
        watchPullRequests: true,
        addedAt: new Date("2025-10-15T00:00:00Z"),
      })

      await createActivity({
        dataSourceId: dataSource.id,
        activityType: ACTIVITY_TYPE.RELEASE,
        status: ACTIVITY_STATUS.COMPLETED,
        title: "Release v1.0.0",
        body: "This is a release",
        occurredAt: new Date("2025-10-16T08:00:00Z"),
        updatedAt: new Date("2025-10-16T08:00:00Z"),
      })

      // 存在しないユーザーIDを含めることでエラーを発生させる
      const invalidUserId = randomUUID()

      const result = await handler(
        { userIds: [invalidUserId, user2.id], useStubSummarization: true },
        lambdaContext,
      )

      expect(result.totalUsers).toBe(2)
      expect(result.successUsers).toBe(1) // user2のみ成功
      expect(result.failedUsers).toBe(1) // invalidUserは失敗
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.userId).toBe(invalidUserId)
      expect(result.totalNotifications).toBe(1) // user2の通知のみ作成
    })
  })
})
