import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  uniqueIndex,
  index,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    auth0UserId: text("auth0_user_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url").notNull(),
    githubUsername: text("github_username"),
    timezone: text("timezone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    auth0UserIdIdx: index("idx_users_auth0_user_id").on(table.auth0UserId),
    emailIdx: index("idx_users_email").on(table.email),
    githubUsernameIdx: index("idx_users_github_username").on(
      table.githubUsername,
    ),
    createdAtIdx: index("idx_users_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_users_updated_at").on(table.updatedAt),
  }),
)

// Data Sources table
export const dataSources = pgTable(
  "data_sources",
  {
    id: uuid("id").primaryKey(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    isPrivate: boolean("is_private").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sourceTypeSourceIdUnique: uniqueIndex(
      "data_sources_source_type_source_id_unique",
    ).on(table.sourceType, table.sourceId),
    sourceTypeIdx: index("idx_data_sources_type").on(table.sourceType),
    sourceIdIdx: index("idx_data_sources_source_id").on(table.sourceId),
    nameIdx: index("idx_data_sources_name").on(table.name),
    createdAtIdx: index("idx_data_sources_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_data_sources_updated_at").on(table.updatedAt),
  }),
)

// Repositories table
export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").primaryKey(),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "cascade" }),
    githubId: bigint("github_id", { mode: "number" }).notNull().unique(),
    fullName: text("full_name").notNull(),
    language: text("language"),
    starsCount: integer("stars_count").notNull(),
    forksCount: integer("forks_count").notNull(),
    openIssuesCount: integer("open_issues_count").notNull(),
    isFork: boolean("is_fork").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dataSourceIdIdx: index("idx_repositories_data_source_id").on(
      table.dataSourceId,
    ),
    githubIdIdx: index("idx_repositories_github_id").on(table.githubId),
    fullNameIdx: index("idx_repositories_full_name").on(table.fullName),
    languageIdx: index("idx_repositories_language").on(table.language),
    starsCountIdx: index("idx_repositories_stars_count").on(table.starsCount),
    createdAtIdx: index("idx_repositories_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_repositories_updated_at").on(table.updatedAt),
  }),
)

// User Watches table
export const userWatches = pgTable(
  "user_watches",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "cascade" }),
    notificationEnabled: boolean("notification_enabled").notNull(),
    watchReleases: boolean("watch_releases").notNull(),
    watchIssues: boolean("watch_issues").notNull(),
    watchPullRequests: boolean("watch_pull_requests").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userDataSourceUnique: uniqueIndex(
      "user_watches_user_id_data_source_id_unique",
    ).on(table.userId, table.dataSourceId),
    userIdIdx: index("idx_user_watches_user_id").on(table.userId),
    dataSourceIdIdx: index("idx_user_watches_data_source_id").on(
      table.dataSourceId,
    ),
    addedAtIdx: index("idx_user_watches_added_at").on(table.addedAt),
  }),
)

// Activities table
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey(),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "cascade" }),
    githubEventId: text("github_event_id").notNull(),
    activityType: text("activity_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    version: text("version"),
    status: text("status").notNull().default("pending"),
    statusDetail: text("status_detail"),
    githubData: text("github_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dataSourceEventTypeUnique: uniqueIndex(
      "activities_data_source_github_activity_type_unique",
    ).on(table.dataSourceId, table.githubEventId, table.activityType),
    dataSourceIdIdx: index("idx_activities_data_source_id").on(
      table.dataSourceId,
    ),
    activityTypeIdx: index("idx_activities_type").on(table.activityType),
    titleIdx: index("idx_activities_title").on(table.title),
    versionIdx: index("idx_activities_version").on(table.version),
    githubEventIdIdx: index("idx_activities_github_event_id").on(
      table.githubEventId,
    ),
    dataSourceTypeIdx: index("idx_activities_data_source_type").on(
      table.dataSourceId,
      table.activityType,
    ),
    dataSourceCreatedIdx: index("idx_activities_data_source_created").on(
      table.dataSourceId,
      table.createdAt,
    ),
    statusIdx: index("idx_activities_status").on(table.status),
    createdAtIdx: index("idx_activities_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_activities_updated_at").on(table.updatedAt),
  }),
)

// User Preferences table
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    emailNotifications: boolean("email_notifications").notNull(),
    timezone: text("timezone"),
    theme: text("theme").notNull(),
    digestDeliveryTimes: jsonb("digest_delivery_times")
      .$type<string[]>()
      .notNull()
      .default(sql`'["18:00"]'::jsonb`),
    digestTimezone: text("digest_timezone"),
    digestEnabled: boolean("digest_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_preferences_user_id").on(table.userId),
    createdAtIdx: index("idx_user_preferences_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_user_preferences_updated_at").on(table.updatedAt),
  }),
)

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookmarkType: text("bookmark_type").notNull(),
    targetId: uuid("target_id").notNull(),
    notes: text("notes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userBookmarkTargetUnique: uniqueIndex(
      "bookmarks_user_bookmark_target_unique",
    ).on(table.userId, table.bookmarkType, table.targetId),
    userIdIdx: index("idx_bookmarks_user_id").on(table.userId),
    targetIdIdx: index("idx_bookmarks_target_id").on(table.targetId),
    typeTargetIdx: index("idx_bookmarks_type_target").on(
      table.bookmarkType,
      table.targetId,
    ),
    userTypeIdx: index("idx_bookmarks_user_type").on(
      table.userId,
      table.bookmarkType,
    ),
    createdAtIdx: index("idx_bookmarks_created_at").on(table.createdAt),
  }),
)

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id").references(() => activities.id, {
      onDelete: "cascade",
    }), // nullable for digest notifications
    title: text("title").notNull(),
    message: text("message").notNull(),
    notificationType: text("notification_type")
      .notNull()
      .default("activity_digest"),
    isRead: boolean("is_read").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text("status").notNull().default("pending"),
    statusDetail: text("status_detail"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notifications_user_id").on(table.userId),
    activityIdIdx: index("idx_notifications_activity_id").on(table.activityId),
    isReadIdx: index("idx_notifications_is_read").on(table.isRead),
    notificationTypeIdx: index("idx_notifications_notification_type").on(
      table.notificationType,
    ),
    scheduledAtIdx: index("idx_notifications_scheduled_at").on(
      table.scheduledAt,
    ),
    statusIdx: index("idx_notifications_status").on(table.status),
    userReadIdx: index("idx_notifications_user_read").on(
      table.userId,
      table.isRead,
    ),
    userCreatedIdx: index("idx_notifications_user_created").on(
      table.userId,
      table.createdAt,
    ),
    sentAtIdx: index("idx_notifications_sent_at").on(table.sentAt),
    createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_notifications_updated_at").on(table.updatedAt),
  }),
)

// User Digest Execution Logs table
export const userDigestExecutionLogs = pgTable(
  "user_digest_execution_logs",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerName: varchar("worker_name", { length: 255 }).notNull(),
    lastSuccessfulRunAt: timestamp("last_successful_run_at", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userWorkerUnique: uniqueIndex(
      "user_digest_execution_logs_user_worker_unique",
    ).on(table.userId, table.workerName),
    userWorkerIdx: index("idx_user_digest_execution_logs_user_worker").on(
      table.userId,
      table.workerName,
    ),
    updatedAtIdx: index("idx_user_digest_execution_logs_updated_at").on(
      table.updatedAt,
    ),
  }),
)

// Notification Activities table (many-to-many relationship)
export const notificationActivities = pgTable(
  "notification_activities",
  {
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: uniqueIndex("notification_activities_pk").on(
      table.notificationId,
      table.activityId,
    ),
    notificationIdx: index("idx_notification_activities_notification").on(
      table.notificationId,
    ),
    activityIdx: index("idx_notification_activities_activity").on(
      table.activityId,
    ),
  }),
)

// Existing Sessions table (for authentication)
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 255 }),
    avatar: text("avatar"),
    provider: varchar("provider", { length: 50 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    loggedInAt: timestamp("logged_in_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_sessions_email").on(table.email),
    expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
    userIdIdx: index("idx_sessions_user_id").on(table.userId),
  }),
)

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  userWatches: many(userWatches),
  preferences: one(userPreferences),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  digestExecutionLogs: many(userDigestExecutionLogs),
}))

export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  repositories: many(repositories),
  userWatches: many(userWatches),
  activities: many(activities),
}))

export const repositoriesRelations = relations(repositories, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [repositories.dataSourceId],
    references: [dataSources.id],
  }),
}))

export const userWatchesRelations = relations(userWatches, ({ one }) => ({
  user: one(users, {
    fields: [userWatches.userId],
    references: [users.id],
  }),
  dataSource: one(dataSources, {
    fields: [userWatches.dataSourceId],
    references: [dataSources.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  dataSource: one(dataSources, {
    fields: [activities.dataSourceId],
    references: [dataSources.id],
  }),
  notifications: many(notifications),
  notificationActivities: many(notificationActivities),
}))

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  }),
)

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(
  notifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
    }),
    activity: one(activities, {
      fields: [notifications.activityId],
      references: [activities.id],
    }),
    notificationActivities: many(notificationActivities),
  }),
)

export const userDigestExecutionLogsRelations = relations(
  userDigestExecutionLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [userDigestExecutionLogs.userId],
      references: [users.id],
    }),
  }),
)

export const notificationActivitiesRelations = relations(
  notificationActivities,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationActivities.notificationId],
      references: [notifications.id],
    }),
    activity: one(activities, {
      fields: [notificationActivities.activityId],
      references: [activities.id],
    }),
  }),
)
