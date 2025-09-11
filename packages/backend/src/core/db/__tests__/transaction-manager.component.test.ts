import { describe, it, expect, beforeEach } from "vitest"
import { TransactionManager } from "../transaction-manager"
import { setupComponentTest } from "../../../test/test-db"
import { TestDataFactory } from "../../../test/factories"
import { users, dataSources } from "../../../db/schema"
import { uuidv7 } from "uuidv7"
import { eq } from "drizzle-orm"

describe("TransactionManager - Component Test", () => {
  setupComponentTest()

  describe("getConnection", () => {
    it("トランザクション外では通常のdb接続を返す", async () => {
      const connection = await TransactionManager.getConnection()
      expect(connection).toBeDefined()
      expect(typeof connection.select).toBe("function")
    })

    it("トランザクション内ではトランザクションインスタンスを返す", async () => {
      type Conn = Awaited<ReturnType<typeof TransactionManager.getConnection>>
      let connectionInTransaction: Conn | undefined
      let connectionOutsideTransaction: Conn

      connectionOutsideTransaction = await TransactionManager.getConnection()

      await TransactionManager.transaction(async () => {
        connectionInTransaction = await TransactionManager.getConnection()
      })

      // トランザクション内外で異なるインスタンスが返されることを確認
      expect(connectionInTransaction).toBeDefined()
      expect(connectionInTransaction).not.toBe(connectionOutsideTransaction)
    })
  })

  describe("transaction", () => {
    it("コールバックの戻り値を正しく返す", async () => {
      const expectedResult = { success: true, data: "test" }

      const result = await TransactionManager.transaction(async () => {
        return expectedResult
      })

      expect(result).toEqual(expectedResult)
    })

    it("実際のデータベース操作がトランザクション内で実行される", async () => {
      const testUser = {
        id: uuidv7(),
        auth0UserId: "auth0|tx_test_user",
        email: "tx-test@example.com",
        name: "Transaction Test User",
        githubUsername: "txuser",
        avatarUrl: "https://example.com/avatar.jpg",
        timezone: "Asia/Tokyo",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // トランザクション内でユーザーを作成
      const result = await TransactionManager.transaction(async () => {
        const connection = await TransactionManager.getConnection()

        // ユーザーを挿入
        const [insertedUser] = await connection
          .insert(users)
          .values(testUser)
          .returning()

        // 同じトランザクション内で検索してみる
        const foundUser = await connection
          .select()
          .from(users)
          .where(eq(users.id, testUser.id))

        return { insertedUser, foundUser: foundUser[0] }
      })

      // トランザクション完了後にデータが正しく保存されていることを確認
      const connection = await TransactionManager.getConnection()
      const savedUser = await connection
        .select()
        .from(users)
        .where(eq(users.id, testUser.id))

      expect(result.insertedUser.id).toBe(testUser.id)
      expect(result.foundUser.id).toBe(testUser.id)
      expect(savedUser[0].id).toBe(testUser.id)
      expect(savedUser[0].email).toBe("tx-test@example.com")
    })

    it("ネストしたトランザクションでは既存のトランザクションを再利用する", async () => {
      type Conn = Awaited<ReturnType<typeof TransactionManager.getConnection>>
      let outerTransaction: Conn | undefined
      let innerTransaction: Conn | undefined
      let middleTransaction: Conn | undefined

      await TransactionManager.transaction(async () => {
        outerTransaction = await TransactionManager.getConnection()

        await TransactionManager.transaction(async () => {
          middleTransaction = await TransactionManager.getConnection()

          await TransactionManager.transaction(async () => {
            innerTransaction = await TransactionManager.getConnection()
          })
        })
      })

      // すべて同じトランザクションインスタンスであることを確認
      expect(outerTransaction).toBe(middleTransaction)
      expect(middleTransaction).toBe(innerTransaction)
    })

    it("エラーが発生した場合にロールバックされる", async () => {
      const testUserId = uuidv7()
      const testDataSourceId = uuidv7()

      // 正常なユーザーを事前に作成
      await TestDataFactory.createTestUser("auth0|rollback_test")

      try {
        await TransactionManager.transaction(async () => {
          const connection = await TransactionManager.getConnection()

          // ユーザーを挿入
          await connection.insert(users).values({
            id: testUserId,
            auth0UserId: "auth0|will_be_rolled_back",
            email: "rollback@example.com",
            name: "Will Be Rolled Back",
            githubUsername: "rollbackuser",
            avatarUrl: "https://example.com/avatar.jpg",
            timezone: "Asia/Tokyo",
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          // データソースを挿入
          await connection.insert(dataSources).values({
            id: testDataSourceId,
            sourceType: "github",
            sourceId: "rollback_test_123",
            name: "Rollback Test Repository",
            description: "This should be rolled back",
            url: "https://github.com/test/rollback",
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          // 意図的にエラーを発生させる
          throw new Error("Intentional rollback test error")
        })
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe("Intentional rollback test error")
      }

      // トランザクションがロールバックされていることを確認
      const connection = await TransactionManager.getConnection()

      const userResult = await connection
        .select()
        .from(users)
        .where(eq(users.id, testUserId))

      const dataSourceResult = await connection
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, testDataSourceId))

      expect(userResult).toHaveLength(0)
      expect(dataSourceResult).toHaveLength(0)
    })

    it("複数のデータベース操作を含む複雑なトランザクションが正常に動作する", async () => {
      const userId = uuidv7()
      const dataSourceId = uuidv7()

      const result = await TransactionManager.transaction(async () => {
        const connection = await TransactionManager.getConnection()

        // ユーザーを作成
        const [user] = await connection
          .insert(users)
          .values({
            id: userId,
            auth0UserId: "auth0|complex_tx_user",
            email: "complex@example.com",
            name: "Complex Transaction User",
            githubUsername: "complexuser",
            avatarUrl: "https://example.com/avatar.jpg",
            timezone: "Asia/Tokyo",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()

        // データソースを作成
        const [dataSource] = await connection
          .insert(dataSources)
          .values({
            id: dataSourceId,
            sourceType: "github",
            sourceId: "complex_test_456",
            name: "Complex Test Repository",
            description: "Complex transaction test",
            url: "https://github.com/test/complex",
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()

        // 作成したデータを検索
        const createdUser = await connection
          .select()
          .from(users)
          .where(eq(users.id, userId))

        const createdDataSource = await connection
          .select()
          .from(dataSources)
          .where(eq(dataSources.id, dataSourceId))

        return {
          user,
          dataSource,
          foundUser: createdUser[0],
          foundDataSource: createdDataSource[0],
        }
      })

      // トランザクション外からも正しくデータが取得できることを確認
      const connection = await TransactionManager.getConnection()

      const finalUser = await connection
        .select()
        .from(users)
        .where(eq(users.id, userId))

      const finalDataSource = await connection
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, dataSourceId))

      expect(result.user.id).toBe(userId)
      expect(result.dataSource.id).toBe(dataSourceId)
      expect(result.foundUser.email).toBe("complex@example.com")
      expect(result.foundDataSource.name).toBe("Complex Test Repository")
      expect(finalUser[0].id).toBe(userId)
      expect(finalDataSource[0].id).toBe(dataSourceId)
    })
  })

  describe("実際のRepository使用パターン", () => {
    beforeEach(async () => {
      // 各テスト用にベースユーザーを作成
      await TestDataFactory.createTestUser("auth0|repository_pattern_user")
    })

    it("Repository層とService層の組み合わせでトランザクションが正常に動作する", async () => {
      const { DataSourceRepository } = await import(
        "../../../features/data-sources/repositories/data-source.repository"
      )

      const dataSourceRepo = new DataSourceRepository()

      const result = await TransactionManager.transaction(async () => {
        // データソース作成
        const dataSource = await dataSourceRepo.save({
          sourceType: "github",
          sourceId: "repo_pattern_test_789",
          name: "Repository Pattern Test",
          description: "Testing repository pattern with transaction",
          url: "https://github.com/test/repo-pattern",
          isPrivate: false,
          repository: {
            githubId: 789123,
            fullName: "test/repo-pattern",
            language: "TypeScript",
            starsCount: 15,
            forksCount: 3,
            openIssuesCount: 1,
            isFork: false,
          },
        })

        return { dataSource }
      })

      // トランザクション完了後に実際にデータが保存されていることを確認
      const savedDataSource = await dataSourceRepo.findById(
        result.dataSource.id,
      )

      expect(savedDataSource).not.toBeNull()
      expect(savedDataSource?.name).toBe("Repository Pattern Test")
      expect(savedDataSource?.repository?.fullName).toBe("test/repo-pattern")
    })
  })
})
