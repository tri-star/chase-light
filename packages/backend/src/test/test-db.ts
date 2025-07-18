import { beforeEach, afterEach, beforeAll, afterAll } from "vitest"
import { connectDb, disconnectDb } from "../db/connection"
import { TestDataFactory } from "./factories"

/**
 * テスト用データベースセットアップヘルパー
 */
export class TestDbHelper {
  /**
   * テストスイート全体で一度だけ実行される初期化
   */
  static setupTestSuite() {
    beforeAll(async () => {
      try {
        // テスト用データベースに接続
        await connectDb()
        console.log("🔗 Connected to test database")
      } catch (error) {
        console.error("Failed to connect to test database:", error)
        process.exit(1)
      }
    })

    afterAll(async () => {
      try {
        // テスト終了時にデータベース接続を閉じる
        await disconnectDb()
        console.log("🔌 Disconnected from test database")
      } catch (error) {
        console.error("Failed to disconnect from test database:", error)
      }
    })
  }

  /**
   * 各テストケースの前後でデータベースをリセット
   */
  static setupTestCase() {
    beforeEach(async () => {
      // 各テスト実行前にデータベースを完全にクリーンアップ（空の状態にする）
      await TestDataFactory.resetDatabase()
    })

    afterEach(async () => {
      // 各テスト実行後にデータベースを完全にクリーンアップ（空の状態にする）
      await TestDataFactory.resetDatabase()
    })
  }

  /**
   * Component Test用のセットアップ
   * データベースの接続とリセットを含む
   */
  static setupComponentTest() {
    this.setupTestSuite()
    this.setupTestCase()
  }

  /**
   * Unit Test用のセットアップ
   * モックを使用するためDB接続は不要
   */
  static setupUnitTest() {
    // Unit Testではモックを使用するため、DB関連の処理は不要
    beforeEach(() => {
      // モックの初期化等が必要な場合はここで実施
    })
  }
}

/**
 * よく使われるテストセットアップのショートカット
 */

/**
 * Component Test用のセットアップを簡単に適用
 *
 * @example
 * describe("User API Component Tests", () => {
 *   setupComponentTest()
 *
 *   test("should create user", async () => {
 *     // テストコード
 *   })
 * })
 */
export function setupComponentTest() {
  TestDbHelper.setupComponentTest()
}

/**
 * Unit Test用のセットアップを簡単に適用
 *
 * @example
 * describe("UserService Unit Tests", () => {
 *   setupUnitTest()
 *
 *   test("should validate email", () => {
 *     // テストコード（モック使用）
 *   })
 * })
 */
export function setupUnitTest() {
  TestDbHelper.setupUnitTest()
}
