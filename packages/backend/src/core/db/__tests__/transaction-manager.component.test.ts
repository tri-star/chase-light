import { describe, it, expect, beforeEach } from "vitest"
import { uuidv7 } from "uuidv7"
import { eq } from "drizzle-orm"
import { TransactionManager } from "../transaction-manager"
import { setupComponentTest } from "../../../test/test-db"
import { TestDataFactory } from "../../../test/factories"
import { users, dataSources } from "../../../db/schema"

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

      const result = await TransactionManager.transaction(async () => {
        const connection = await TransactionManager.getConnection()

        const [insertedUser] = await connection
          .insert(users)
          .values(testUser)
          .returning()

        const foundUser = await connection
          .select()
          .from(users)
          .where(eq(users.id, testUser.id))

        return { insertedUser, foundUser: foundUser[0] }
      })

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

      expect(outerTransaction).toBe(middleTransaction)
      expect(middleTransaction).toBe(innerTransaction)
    })

    it("エラーが発生した場合にロールバックされる", async () => {
      const testUserId = uuidv7()
      const testDataSourceId = uuidv7()

      await TestDataFactory.createTestUser("auth0|rollback_test")

      try {
        await TransactionManager.transaction(async () => {
          const connection = await TransactionManager.getConnection()

          await connection.insert(users).values({
            id: testUserId,
            auth0UserId: "auth0|tx_error_user",
            email: "tx-error@example.com",
            name: "Tx Error User",
            githubUsername: "txerror",
            avatarUrl: "https://example.com/avatar2.jpg",
            timezone: "Asia/Tokyo",
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          await connection.insert(dataSources).values({
            id: testDataSourceId,
            sourceType: "github",
            sourceId: "tx_error_repo",
            name: "Tx Error Repo",
            description: "Repository that causes error",
            url: "https://github.com/test/error",
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          throw new Error("Intentional error to trigger rollback")
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe(
          "Intentional error to trigger rollback",
        )
      }

      const connection = await TransactionManager.getConnection()

      const savedUser = await connection
        .select()
        .from(users)
        .where(eq(users.id, testUserId))

      const savedDataSource = await connection
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, testDataSourceId))

      expect(savedUser).toHaveLength(0)
      expect(savedDataSource).toHaveLength(0)
    })

    it("複数のデータベース操作を含む複雑なトランザクションが正常に動作する", async () => {
      const userId = uuidv7()
      const dataSourceId = uuidv7()

      const result = await TransactionManager.transaction(async () => {
        const connection = await TransactionManager.getConnection()

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
      await TestDataFactory.createTestUser("auth0|repository_pattern_user")
    })

    it("Repository層とService層の組み合わせでトランザクションが正常に動作する", async () => {
      const { DrizzleDataSourceRepository } = await import(
        "../../../features/data-sources/infra/repositories"
      )

      const dataSourceRepo = new DrizzleDataSourceRepository()

      const result = await TransactionManager.transaction(async () => {
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

      const savedDataSource = await dataSourceRepo.findById(
        result.dataSource.id,
      )

      expect(savedDataSource).not.toBeNull()
      expect(savedDataSource?.name).toBe("Repository Pattern Test")
      expect(savedDataSource?.repository?.fullName).toBe("test/repo-pattern")
    })
  })
})
