import { describe, test, expect, beforeEach } from "vitest"
import { DataSourceRepository } from "../data-source.repository"
import type { DataSourceCreationInput } from "../../domain"
import { TestDataFactory, setupComponentTest } from "../../../../test"
import { uuidv7 } from "uuidv7"

// Repository Unit Test: 実DBを使用してデータアクセス層をテスト

describe("DataSourceRepository - Unit Test", () => {
  setupComponentTest()

  let dataSourceRepository: DataSourceRepository

  beforeEach(() => {
    dataSourceRepository = new DataSourceRepository()
  })

  describe("save()", () => {
    test("新規データソースのINSERTが正常に動作する", async () => {
      const newDataSourceInput: DataSourceCreationInput = {
        sourceType: "github",
        sourceId: "987654321",
        name: "新規リポジトリ",
        description: "テスト用の新規リポジトリです",
        url: "https://github.com/test/newrepo",
        isPrivate: false,
      }

      // INSERT実行
      const savedDataSource =
        await dataSourceRepository.save(newDataSourceInput)

      // データが正しく保存されているか確認
      expect(savedDataSource.id).toBeDefined()
      expect(savedDataSource.sourceType).toBe("github")
      expect(savedDataSource.sourceId).toBe("987654321")
      expect(savedDataSource.name).toBe("新規リポジトリ")
      expect(savedDataSource.description).toBe("テスト用の新規リポジトリです")
      expect(savedDataSource.url).toBe("https://github.com/test/newrepo")
      expect(savedDataSource.isPrivate).toBe(false)
      expect(savedDataSource.createdAt).toBeInstanceOf(Date)
      expect(savedDataSource.updatedAt).toBeInstanceOf(Date)

      // DBから取得して確認
      const foundDataSource = await dataSourceRepository.findById(
        savedDataSource.id,
      )
      expect(foundDataSource).not.toBeNull()
      expect(foundDataSource?.name).toBe("新規リポジトリ")
    })

    test("既存データソースのUPDATEが正常に動作する（重複キーの場合）", async () => {
      // 既存データソースを作成
      const existingDataSource = await TestDataFactory.createTestDataSource({
        sourceType: "github",
        sourceId: "duplicate_test",
        name: "元の名前",
      })

      const originalUpdatedAt = existingDataSource.updatedAt

      // 少し待って時刻を変える
      await new Promise((resolve) => globalThis.setTimeout(resolve, 10))

      // 同じsourceType + sourceIdで更新実行
      const updateInput: DataSourceCreationInput = {
        sourceType: "github",
        sourceId: "duplicate_test",
        name: "更新された名前",
        description: "更新された説明",
        url: "https://github.com/test/updated",
        isPrivate: true,
      }

      const updatedDataSource = await dataSourceRepository.save(updateInput)

      // データが正しく更新されているか確認
      expect(updatedDataSource.name).toBe("更新された名前")
      expect(updatedDataSource.description).toBe("更新された説明")
      expect(updatedDataSource.isPrivate).toBe(true)
      expect(updatedDataSource.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      )
    })
  })

  describe("findById()", () => {
    test("存在するデータソースIDで正常に取得できる", async () => {
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "findByIdテスト",
        sourceId: "findbyid_test",
      })

      const foundDataSource = await dataSourceRepository.findById(
        testDataSource.id,
      )

      expect(foundDataSource).not.toBeNull()
      expect(foundDataSource?.id).toBe(testDataSource.id)
      expect(foundDataSource?.name).toBe("findByIdテスト")
      expect(foundDataSource?.sourceId).toBe("findbyid_test")
    })

    test("存在しないデータソースIDの場合はnullを返す", async () => {
      const nonExistentId = uuidv7()

      const foundDataSource = await dataSourceRepository.findById(nonExistentId)

      expect(foundDataSource).toBeNull()
    })
  })

  describe("findBySourceTypeAndId()", () => {
    test("存在するsourceTypeとsourceIdで正常に取得できる", async () => {
      await TestDataFactory.createTestDataSource({
        sourceType: "github",
        sourceId: "findbytype_test",
        name: "findBySourceTypeAndIdテスト",
      })

      const foundDataSource = await dataSourceRepository.findBySourceTypeAndId(
        "github",
        "findbytype_test",
      )

      expect(foundDataSource).not.toBeNull()
      expect(foundDataSource?.sourceType).toBe("github")
      expect(foundDataSource?.sourceId).toBe("findbytype_test")
      expect(foundDataSource?.name).toBe("findBySourceTypeAndIdテスト")
    })

    test("存在しないsourceTypeとsourceIdの場合はnullを返す", async () => {
      const foundDataSource = await dataSourceRepository.findBySourceTypeAndId(
        "github",
        "nonexistent",
      )

      expect(foundDataSource).toBeNull()
    })
  })

  describe("findMany()", () => {
    test("フィルタなしで全データソースを取得できる", async () => {
      // テストデータソースを複数作成
      await TestDataFactory.createTestDataSource({ name: "テスト1" })
      await TestDataFactory.createTestDataSource({ name: "テスト2" })
      await TestDataFactory.createTestDataSource({ name: "テスト3" })

      const dataSources = await dataSourceRepository.findMany()

      expect(dataSources.length).toBeGreaterThanOrEqual(3)
      expect(Array.isArray(dataSources)).toBe(true)
    })

    test("sourceTypeフィルタが正常に動作する", async () => {
      await TestDataFactory.createTestDataSource({
        sourceType: "github",
        sourceId: "github_test",
        name: "GitHubテスト",
      })
      await TestDataFactory.createTestDataSource({
        sourceType: "npm",
        sourceId: "npm_test",
        name: "NPMテスト",
      })

      const githubDataSources = await dataSourceRepository.findMany({
        sourceType: "github",
      })

      expect(githubDataSources.length).toBeGreaterThanOrEqual(1)
      expect(githubDataSources.every((ds) => ds.sourceType === "github")).toBe(
        true,
      )
    })
  })

  describe("delete()", () => {
    test("存在するデータソースの削除が正常に動作する", async () => {
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "削除テスト",
      })

      const result = await dataSourceRepository.delete(testDataSource.id)

      expect(result).toBe(true)

      // 削除されたことを確認
      const deletedDataSource = await dataSourceRepository.findById(
        testDataSource.id,
      )
      expect(deletedDataSource).toBeNull()
    })

    test("存在しないデータソースの削除はfalseを返す", async () => {
      const nonExistentId = uuidv7()

      const result = await dataSourceRepository.delete(nonExistentId)

      expect(result).toBe(false)
    })
  })
})
