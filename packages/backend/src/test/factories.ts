import { seed, reset } from "drizzle-seed"
import { db } from "../db/connection"
import * as schema from "../db/schema"
import { User } from "../features/identity/domain/user"
import {
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  type ActivityStatus,
  type ActivityType,
} from "../features/activities"

import type {
  GitHubDataSource,
  Repository,
  RepositoryCreationInput,
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
    const randomSuffix = Math.random().toString(36).substring(2, 11)
    const user: User = {
      id: uuidv7(),
      auth0UserId: `auth0|custom_${Date.now()}_${randomSuffix}`,
      email: `custom_${randomSuffix}@example.com`,
      name: "カスタムユーザー",
      githubUsername: `customuser_${randomSuffix}`,
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
   * テスト用データソースを作成（GitHubDataSource構造で）
   */
  static async createTestDataSource(
    customData?: Partial<Omit<GitHubDataSource, "repository">> & {
      repository?: Partial<RepositoryCreationInput>
    },
  ): Promise<GitHubDataSource> {
    const now = new Date()
    const sourceId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // デフォルトのリポジトリデータ
    const defaultRepository: RepositoryCreationInput = {
      githubId: Math.floor(Math.random() * 1000000000),
      fullName: "test/repository",
      language: "TypeScript",
      starsCount: 100,
      forksCount: 20,
      openIssuesCount: 5,
      isFork: false,
      ...customData?.repository,
    }

    // データソース情報
    const dataSourceData = {
      id: uuidv7(),
      sourceType: "github" as const,
      sourceId,
      name: "Test Repository",
      description: "A test repository",
      url: "https://github.com/test/repository",
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
      ...customData,
    }

    // データソースをDBに挿入
    await db.insert(schema.dataSources).values(dataSourceData)

    // リポジトリをDBに挿入
    const repositoryId = uuidv7()
    const repositoryData = {
      id: repositoryId,
      dataSourceId: dataSourceData.id,
      githubId: defaultRepository.githubId,
      fullName: defaultRepository.fullName,
      language: defaultRepository.language,
      starsCount: defaultRepository.starsCount,
      forksCount: defaultRepository.forksCount,
      openIssuesCount: defaultRepository.openIssuesCount,
      isFork: defaultRepository.isFork,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(schema.repositories).values(repositoryData)

    // GitHubDataSourceとして返す
    return {
      ...dataSourceData,
      repository: {
        id: repositoryId,
        githubId: defaultRepository.githubId,
        fullName: defaultRepository.fullName,
        owner: defaultRepository.fullName.split("/")[0] || "",
        language: defaultRepository.language,
        starsCount: defaultRepository.starsCount,
        forksCount: defaultRepository.forksCount,
        openIssuesCount: defaultRepository.openIssuesCount,
        isFork: defaultRepository.isFork,
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  /**
   * テスト用リポジトリを作成
   * @deprecated GitHubDataSourceに統合されたため、createTestDataSource()を使用してください
   */
  static async createTestRepository(
    _dataSourceId: string,
    _customData?: Partial<Repository>,
  ): Promise<Repository> {
    // この方法はもはや使用できません - repositoryはGitHubDataSource内に内包されています
    throw new Error(
      "createTestRepository is deprecated. Use createTestDataSource() instead - repository is now embedded in GitHubDataSource.",
    )
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
   * テスト用アクティビティを作成
   */
  /**
   * テスト用アクティビティを作成
   */
  static async createTestActivity(
    dataSourceId: string,
    customData?: {
      githubEventId?: string
      activityType?: ActivityType
      title?: string
      body?: string
      version?: string | null
      status?: ActivityStatus
      statusDetail?: string | null
      githubData?: string | null
      createdAt?: Date
      updatedAt?: Date
    },
  ): Promise<{
    id: string
    dataSourceId: string
    githubEventId: string
    activityType: ActivityType
    title: string
    body: string
    version: string | null
    status: ActivityStatus
    statusDetail: string | null
    githubData: string | null
    createdAt: Date
    updatedAt: Date
  }> {
    const now = new Date()
    const createdAt = customData?.createdAt ?? now
    const updatedAt = customData?.updatedAt ?? now
    const version =
      customData && Object.prototype.hasOwnProperty.call(customData, "version")
        ? (customData.version ?? null)
        : "v1.0.0"

    const activity = {
      id: uuidv7(),
      dataSourceId,
      githubEventId: customData?.githubEventId ?? `event_${Date.now()}`,
      activityType: customData?.activityType ?? ACTIVITY_TYPE.RELEASE,
      title: customData?.title ?? "Test Activity",
      body: customData?.body ?? "Test activity body",
      version,
      status: customData?.status ?? ACTIVITY_STATUS.PENDING,
      statusDetail: customData?.statusDetail ?? null,
      githubData: customData?.githubData ?? null,
      createdAt,
      updatedAt,
    }

    await db.insert(schema.activities).values(activity)
    return activity
  }

  /**
   * テスト用通知を作成
   */
  static async createTestNotification(
    userId: string,
    activityId: string,
    customData?: {
      title?: string
      message?: string
      notificationType?: string
      isRead?: boolean
      sentAt?: Date
    },
  ): Promise<{
    id: string
    userId: string
    activityId: string
    title: string
    message: string
    notificationType: string
    isRead: boolean
    sentAt: Date | null
    createdAt: Date
    updatedAt: Date
  }> {
    const now = new Date()
    const notification = {
      id: uuidv7(),
      userId,
      activityId,
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
      dataSource?: Partial<Omit<GitHubDataSource, "repository">> & {
        repository?: Partial<RepositoryCreationInput>
      }
      userWatch?: Partial<UserWatch>
    },
  ): Promise<{
    dataSource: GitHubDataSource
    repository: Repository
    userWatch: UserWatch
  }> {
    const dataSource = await this.createTestDataSource(customData?.dataSource)
    // repository は dataSource に内包されているため、createTestRepository は呼ばない
    const userWatch = await this.createTestUserWatch(
      userId,
      dataSource.id,
      customData?.userWatch,
    )

    return {
      dataSource,
      repository: dataSource.repository,
      userWatch,
    }
  }
}
