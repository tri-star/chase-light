import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "./connection"
import {
  activities,
  notifications,
  userWatches,
  dataSources,
  userPreferences,
} from "./schema"
import type {
  ActivityStatus,
  ActivityType,
} from "../features/activities/domain"
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "../features/activities/domain"

export type CreateActivityInput = {
  dataSourceId: string
  githubEventId?: string
  activityType?: ActivityType
  title?: string
  body?: string
  version?: string | null
  status?: ActivityStatus
  statusDetail?: string | null
  githubData?: string | null
  occurredAt?: Date
  updatedAt?: Date
}

export async function createActivity(
  input: CreateActivityInput,
): Promise<typeof activities.$inferSelect> {
  const now = new Date()
  const createdAt = input.occurredAt ?? now
  const updatedAt = input.updatedAt ?? now

  const [record] = await db
    .insert(activities)
    .values({
      id: randomUUID(),
      dataSourceId: input.dataSourceId,
      githubEventId: input.githubEventId ?? `evt_${randomUUID()}`,
      activityType: input.activityType ?? ACTIVITY_TYPE.RELEASE,
      title: input.title ?? "Test Activity",
      body: input.body ?? "Activity body",
      version: input.version ?? null,
      status: input.status ?? ACTIVITY_STATUS.COMPLETED,
      statusDetail: input.statusDetail ?? null,
      githubData: input.githubData ?? null,
      createdAt,
      updatedAt,
    })
    .returning()

  return record
}

export type CreateActivityNotificationInput = {
  activityId: string
  userId: string
  title?: string
  message?: string
  notificationType?: string
  isRead?: boolean
  sentAt?: Date | null
  scheduledAt?: Date
  status?: string
  statusDetail?: string | null
  metadata?: Record<string, unknown> | null
}

export async function createActivityNotification(
  input: CreateActivityNotificationInput,
): Promise<typeof notifications.$inferSelect> {
  const now = new Date()
  const [record] = await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      userId: input.userId,
      activityId: input.activityId,
      title: input.title ?? "Activity updated",
      message: input.message ?? "Activity notification",
      notificationType: input.notificationType ?? "activity_digest",
      isRead: input.isRead ?? false,
      sentAt: input.sentAt ?? null,
      scheduledAt: input.scheduledAt ?? now,
      status: input.status ?? "pending",
      statusDetail: input.statusDetail ?? null,
      metadata: input.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return record
}

export type CreateUserWatchInput = {
  userId: string
  dataSourceId: string
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
  addedAt?: Date
}

export async function createUserWatch(
  input: CreateUserWatchInput,
): Promise<typeof userWatches.$inferSelect> {
  const [record] = await db
    .insert(userWatches)
    .values({
      id: randomUUID(),
      userId: input.userId,
      dataSourceId: input.dataSourceId,
      notificationEnabled: input.notificationEnabled ?? true,
      watchReleases: input.watchReleases ?? true,
      watchIssues: input.watchIssues ?? true,
      watchPullRequests: input.watchPullRequests ?? true,
      addedAt: input.addedAt ?? new Date(),
    })
    .returning()

  return record
}

export async function ensureDataSourceExists(
  dataSourceId: string,
): Promise<void> {
  const existing = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(eq(dataSources.id, dataSourceId))
    .limit(1)

  if (existing.length === 0) {
    throw new Error(
      `Data source ${dataSourceId} does not exist. Please create it before linking activities.`,
    )
  }
}

export type CreateUserPreferenceInput = {
  userId: string
  emailNotifications?: boolean
  timezone?: string | null
  theme?: string
  digestDeliveryTimes?: string[]
  digestTimezone?: string | null
  digestEnabled?: boolean
}

export async function createUserPreference(
  input: CreateUserPreferenceInput,
): Promise<typeof userPreferences.$inferSelect> {
  const now = new Date()
  const [record] = await db
    .insert(userPreferences)
    .values({
      id: randomUUID(),
      userId: input.userId,
      emailNotifications: input.emailNotifications ?? true,
      timezone: input.timezone ?? null,
      theme: input.theme ?? "system",
      digestDeliveryTimes: input.digestDeliveryTimes ?? ["18:00"],
      digestTimezone: input.digestTimezone ?? input.timezone ?? null,
      digestEnabled: input.digestEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        emailNotifications: input.emailNotifications ?? true,
        timezone: input.timezone ?? null,
        theme: input.theme ?? "system",
        digestDeliveryTimes: input.digestDeliveryTimes ?? ["18:00"],
        digestTimezone: input.digestTimezone ?? input.timezone ?? null,
        digestEnabled: input.digestEnabled ?? true,
        updatedAt: now,
      },
    })
    .returning()

  return record
}
