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
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

// Events table
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey(),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "cascade" }),
    githubEventId: text("github_event_id").notNull(),
    eventType: text("event_type").notNull(),
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
      "events_data_source_github_event_type_unique",
    ).on(table.dataSourceId, table.githubEventId, table.eventType),
    dataSourceIdIdx: index("idx_events_data_source_id").on(table.dataSourceId),
    eventTypeIdx: index("idx_events_type").on(table.eventType),
    titleIdx: index("idx_events_title").on(table.title),
    versionIdx: index("idx_events_version").on(table.version),
    githubEventIdIdx: index("idx_events_github_event_id").on(
      table.githubEventId,
    ),
    dataSourceTypeIdx: index("idx_events_data_source_type").on(
      table.dataSourceId,
      table.eventType,
    ),
    dataSourceCreatedIdx: index("idx_events_data_source_created").on(
      table.dataSourceId,
      table.createdAt,
    ),
    statusIdx: index("idx_events_status").on(table.status),
    createdAtIdx: index("idx_events_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_events_updated_at").on(table.updatedAt),
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
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    notificationType: text("notification_type").notNull(),
    isRead: boolean("is_read").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notifications_user_id").on(table.userId),
    eventIdIdx: index("idx_notifications_event_id").on(table.eventId),
    isReadIdx: index("idx_notifications_is_read").on(table.isRead),
    notificationTypeIdx: index("idx_notifications_notification_type").on(
      table.notificationType,
    ),
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
}))

export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  repositories: many(repositories),
  userWatches: many(userWatches),
  events: many(events),
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

export const eventsRelations = relations(events, ({ one, many }) => ({
  dataSource: one(dataSources, {
    fields: [events.dataSourceId],
    references: [dataSources.id],
  }),
  notifications: many(notifications),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}))
