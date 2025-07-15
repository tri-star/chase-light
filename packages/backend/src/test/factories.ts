import { seed, reset } from "drizzle-seed"
import { db } from "../db/connection"
import * as schema from "../db/schema"
import { User } from "../features/user/domain/user"
import type {
  DataSource,
  Repository,
  UserWatch,
} from "../features/data-sources/domain"
import { uuidv7 } from "uuidv7"
import { sql } from "drizzle-orm"

/**
 * テストデータファクトリ
 * drizzle-seedを使用してテストデータを生成する
 */
export class TestDataFactory {
  /**
   * データベース全体をリセット（完全に空にする）
   */
  static async resetDatabase(): Promise<void> {
    try {
      // drizzle-seedのreset機能を使用
      await reset(db, schema)
    } catch (error) {
      // reset()が期待通りに動作しない場合は、手動で全テーブルを削除
      console.warn(
        "drizzle-seed reset failed, falling back to manual cleanup:",
        error,
      )
      await this.manualCleanup()
    }
  }

  /**
   * 手動でのデータベースクリーンアップ（完全削除）
   */
  private static async manualCleanup(): Promise<void> {
    try {
      // PostgreSQLの機能を使用して全テーブルを取得し、一括TRUNCATE
      const result = await db.execute(sql`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `)

      const tableNames = result.rows.map((row) => row.tablename as string)

      if (tableNames.length > 0) {
        // 全テーブルを一括でTRUNCATE（外部キー制約も自動処理）
        const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(", ")} RESTART IDENTITY CASCADE`
        await db.execute(sql.raw(truncateQuery))

        console.log(
          `🧹 Database manually cleaned up (${tableNames.length} tables truncated)`,
        )
      }
    } catch (error) {
      console.error("Manual cleanup failed:", error)
      throw error
    }
  }

  /**
   * 基本的なテストデータを生成（オプション）
   * 通常は使用せず、各テストで必要なデータのみを作成することを推奨
   */
  static async seedBasicData(count = 10): Promise<void> {
    await seed(db, schema, { count })
  }

  /**
   * ユーザー用のテストデータを生成
   */
  static async createTestUsers(count = 5): Promise<User[]> {
    const users: User[] = []

    for (let i = 0; i < count; i++) {
      const user: User = {
        id: uuidv7(),
        auth0UserId: `auth0|test_user_${i + 1}`,
        email: `test${i + 1}@example.com`,
        name: `テストユーザー${i + 1}`,
        githubUsername: `testuser${i + 1}`,
        avatarUrl: `https://example.com/avatar${i + 1}.jpg`,
        timezone: "Asia/Tokyo",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.push(user)
    }

    // データベースに直接挿入
    await db.insert(schema.users).values(users)

    return users
  }

  /**
   * 特定のAuth0 IDを持つテストユーザーを作成
   */
  static async createTestUser(auth0UserId: string): Promise<User> {
    const user: User = {
      id: uuidv7(),
      auth0UserId,
      email: `${auth0UserId.replace("|", "_")}@example.com`,
      name: "テストユーザー",
      githubUsername: "testuser",
      avatarUrl: "https://example.com/avatar.jpg",
      timezone: "Asia/Tokyo",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(schema.users).values(user)
    return user
  }

  /**
   * カスタムユーザーデータを生成
   */
  static async createCustomUser(customData: Partial<User>): Promise<User> {
    const user: User = {
      id: uuidv7(),
      auth0UserId: `auth0|custom_${Date.now()}`,
      email: "custom@example.com",
      name: "カスタムユーザー",
      githubUsername: "customuser",
      avatarUrl: "https://example.com/custom.jpg",
      timezone: "Asia/Tokyo",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customData,
    }

    await db.insert(schema.users).values(user)
    return user
  }

  /**
   * テスト用データソースを作成
   */
  static async createTestDataSource(
    customData?: Partial<DataSource>,
  ): Promise<DataSource> {
    const now = new Date()
    const dataSource: DataSource = {
      id: uuidv7(),
      sourceType: "github",
      sourceId: `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // ユニークなIDを生成
      name: "Test Repository",
      description: "A test repository",
      url: "https://github.com/test/repository",
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
      ...customData,
    }

    await db.insert(schema.dataSources).values(dataSource)
    return dataSource
  }

  /**
   * テスト用リポジトリを作成
   */
  static async createTestRepository(
    dataSourceId: string,
    customData?: Partial<Repository>,
  ): Promise<Repository> {
    const now = new Date()
    const repository: Repository = {
      id: uuidv7(),
      dataSourceId,
      githubId: 123456789,
      fullName: "test/repository",
      owner: "test",
      language: "TypeScript",
      starsCount: 100,
      forksCount: 20,
      openIssuesCount: 5,
      isFork: false,
      createdAt: now,
      updatedAt: now,
      ...customData,
    }

    await db.insert(schema.repositories).values(repository)
    return repository
  }

  /**
   * テスト用ユーザーウォッチを作成
   */
  static async createTestUserWatch(
    userId: string,
    dataSourceId: string,
    customData?: Partial<UserWatch>,
  ): Promise<UserWatch> {
    const now = new Date()
    const userWatch: UserWatch = {
      id: uuidv7(),
      userId,
      dataSourceId,
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: false,
      watchPullRequests: false,
      addedAt: now,
      ...customData,
    }

    await db.insert(schema.userWatches).values(userWatch)
    return userWatch
  }

  /**
   * テスト用イベントを作成
   */
  static async createTestEvent(
    dataSourceId: string,
    customData?: {
      githubEventId?: string
      eventType?: string
      title?: string
      body?: string
      version?: string
      createdAt?: Date
    },
  ): Promise<{ id: string; dataSourceId: string; githubEventId: string; eventType: string; title: string; body: string; version: string | null; createdAt: Date; updatedAt: Date }> {
    const now = new Date()
    const event = {
      id: uuidv7(),
      dataSourceId,
      githubEventId: customData?.githubEventId || `event_${Date.now()}`,
      eventType: customData?.eventType || "release",
      title: customData?.title || "Test Event",
      body: customData?.body || "Test event body",
      version: customData?.version || "v1.0.0",
      createdAt: customData?.createdAt || now,
      updatedAt: now,
    }

    await db.insert(schema.events).values(event)
    return event
  }

  /**
   * テスト用通知を作成
   */
  static async createTestNotification(
    userId: string,
    eventId: string,
    customData?: {
      title?: string
      message?: string
      notificationType?: string
      isRead?: boolean
      sentAt?: Date
    },
  ): Promise<{ id: string; userId: string; eventId: string; title: string; message: string; notificationType: string; isRead: boolean; sentAt: Date | null; createdAt: Date; updatedAt: Date }> {
    const now = new Date()
    const notification = {
      id: uuidv7(),
      userId,
      eventId,
      title: customData?.title || "Test Notification",
      message: customData?.message || "Test notification message",
      notificationType: customData?.notificationType || "release",
      isRead: customData?.isRead || false,
      sentAt: customData?.sentAt || now,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(schema.notifications).values(notification)
    return notification
  }

  /**
   * 完全なデータソースセット（データソース + リポジトリ + ユーザーウォッチ）を作成
   */
  static async createCompleteDataSourceSet(
    userId: string,
    customData?: {
      dataSource?: Partial<DataSource>
      repository?: Partial<Repository>
      userWatch?: Partial<UserWatch>
    },
  ): Promise<{
    dataSource: DataSource
    repository: Repository
    userWatch: UserWatch
  }> {
    const dataSource = await this.createTestDataSource(customData?.dataSource)
    const repository = await this.createTestRepository(
      dataSource.id,
      customData?.repository,
    )
    const userWatch = await this.createTestUserWatch(
      userId,
      dataSource.id,
      customData?.userWatch,
    )

    return {
      dataSource,
      repository,
      userWatch,
    }
  }
}
