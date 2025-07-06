import { seed, reset } from "drizzle-seed"
import { db } from "../db/connection"
import * as schema from "../db/schema"
import { User } from "../features/user/domain/user"
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
}
