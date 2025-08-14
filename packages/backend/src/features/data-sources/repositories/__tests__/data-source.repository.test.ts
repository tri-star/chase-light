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
        repository: {
          githubId: 987654321,
          fullName: "test/newrepo",
          language: "TypeScript",
          starsCount: 100,
          forksCount: 20,
          openIssuesCount: 5,
          isFork: false,
        },
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

      // repository情報も確認
      const githubDataSource = savedDataSource
      expect(githubDataSource?.repository).toBeDefined()
      expect(githubDataSource?.repository.githubId).toBe(987654321)
      expect(githubDataSource?.repository.fullName).toBe("test/newrepo")
      expect(githubDataSource?.repository.owner).toBe("test")
      expect(githubDataSource?.repository.language).toBe("TypeScript")
      expect(githubDataSource?.repository.starsCount).toBe(100)
      expect(githubDataSource?.repository.forksCount).toBe(20)
      expect(githubDataSource?.repository.openIssuesCount).toBe(5)
      expect(githubDataSource?.repository.isFork).toBe(false)

      // DBから取得して確認
      const foundDataSource = await dataSourceRepository.findById(
        savedDataSource.id,
      )
      expect(foundDataSource).not.toBeNull()
      expect(foundDataSource?.name).toBe("新規リポジトリ")

      // repository情報も取得されているか確認
      const foundGitHubDataSource = foundDataSource
      expect(foundGitHubDataSource?.repository).toBeDefined()
      expect(foundGitHubDataSource?.repository.fullName).toBe("test/newrepo")
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
        repository: {
          githubId: 999999999,
          fullName: "test/updated",
          language: "JavaScript",
          starsCount: 200,
          forksCount: 40,
          openIssuesCount: 10,
          isFork: false,
        },
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

      // repository情報も取得されているか確認
      const githubDataSource = foundDataSource
      expect(githubDataSource?.repository).toBeDefined()
      expect(githubDataSource?.repository.fullName).toBe("test/repository")
      expect(githubDataSource?.repository.owner).toBe("test")
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

      // repository情報も取得されているか確認
      const githubDataSource = foundDataSource
      expect(githubDataSource?.repository).toBeDefined()
      expect(githubDataSource?.repository.fullName).toBe("test/repository")
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

      // 各データソースにrepository情報が含まれていることを確認
      dataSources.forEach((dataSource) => {
        const githubDataSource = dataSource
        expect(githubDataSource?.repository).toBeDefined()
        expect(githubDataSource?.repository.fullName).toBeDefined()
      })
    })

    test("sourceTypeフィルタが正常に動作する", async () => {
      await TestDataFactory.createTestDataSource({
        sourceType: "github",
        sourceId: "github_test",
        name: "GitHubテスト",
      })
      // NPMは将来実装予定のため、GitHubのみテスト

      const githubDataSources = await dataSourceRepository.findMany({
        sourceType: "github",
      })

      expect(githubDataSources.length).toBeGreaterThanOrEqual(1)
      expect(githubDataSources.every((ds) => ds.sourceType === "github")).toBe(
        true,
      )

      // repository情報も含まれていることを確認
      githubDataSources.forEach((dataSource) => {
        const githubDataSource = dataSource
        expect(githubDataSource?.repository).toBeDefined()
      })
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

  describe("findByIdWithUserAccess()", () => {
    test("ユーザーがWatch中のデータソースを詳細情報付きで取得できる", async () => {
      // テストユーザーを作成
      const testUser =
        await TestDataFactory.createTestUser("detail-test-user-1")

      // テストデータソース（repository内包）を作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "詳細テスト用リポジトリ",
        sourceId: "detail-123456789",
        sourceType: "github",
        repository: {
          fullName: "detail-test/repository",
          githubId: 987654321,
          starsCount: 200,
          language: "TypeScript",
          forksCount: 50,
          openIssuesCount: 10,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          watchReleases: true,
          watchIssues: true,
          watchPullRequests: false,
          notificationEnabled: true,
        },
      )

      // メソッドを実行
      const result = await dataSourceRepository.findByIdWithUserAccess(
        testDataSource.id,
        testUser.id,
      )

      // 結果を検証
      expect(result).not.toBeNull()
      expect(result?.dataSource.id).toBe(testDataSource.id)
      expect(result?.dataSource.name).toBe("詳細テスト用リポジトリ")
      // repositoryはdataSource内に内包されている
      const githubDataSource = result?.dataSource
      expect(githubDataSource?.repository.fullName).toBe(
        "detail-test/repository",
      )
      expect(githubDataSource?.repository.owner).toBe("detail-test")
      expect(githubDataSource?.repository.githubId).toBe(987654321)
      expect(githubDataSource?.repository.language).toBe("TypeScript")
      expect(result?.userWatch.userId).toBe(testUser.id)
      expect(result?.userWatch.watchReleases).toBe(true)
      expect(result?.userWatch.watchIssues).toBe(true)
      expect(result?.userWatch.watchPullRequests).toBe(false)
    })

    test("ユーザーがWatch対象外のデータソースの場合はnullを返す", async () => {
      // テストユーザーを作成
      const testUser =
        await TestDataFactory.createTestUser("detail-test-user-2")

      // 他のユーザーのデータソースを作成
      const otherUser = await TestDataFactory.createTestUser("other-user")
      const otherDataSource = await TestDataFactory.createTestDataSource({
        name: "他ユーザーのリポジトリ",
        sourceId: "other-123456789",
        sourceType: "github",
        repository: {
          fullName: "other/repository",
          githubId: 111111111,
          language: "JavaScript",
          starsCount: 50,
          forksCount: 10,
          openIssuesCount: 2,
          isFork: false,
        },
      })

      // 他のユーザーのウォッチを作成
      await TestDataFactory.createTestUserWatch(
        otherUser.id,
        otherDataSource.id,
        {},
      )

      // メソッドを実行（testUserはotherDataSourceをWatch対象外）
      const result = await dataSourceRepository.findByIdWithUserAccess(
        otherDataSource.id,
        testUser.id,
      )

      // nullが返ることを確認
      expect(result).toBeNull()
    })

    test("存在しないデータソースIDの場合はnullを返す", async () => {
      const testUser =
        await TestDataFactory.createTestUser("detail-test-user-3")
      const nonExistentId = uuidv7()

      const result = await dataSourceRepository.findByIdWithUserAccess(
        nonExistentId,
        testUser.id,
      )

      expect(result).toBeNull()
    })
  })

  describe("findByUserWithFilters()", () => {
    test("ユーザーIDでフィルタリングしてデータソース一覧を取得できる", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-1")

      // テストデータソース（repository内包）を作成
      const testDataSource = await TestDataFactory.createTestDataSource({
        name: "テストリポジトリ",
        sourceId: "123456789",
        sourceType: "github",
        repository: {
          fullName: "test/repository",
          githubId: 123456789,
          starsCount: 100,
          language: "JavaScript",
          forksCount: 20,
          openIssuesCount: 5,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(
        testUser.id,
        testDataSource.id,
        {
          watchReleases: true,
          watchIssues: false,
          watchPullRequests: false,
          notificationEnabled: true,
        },
      )

      // メソッドを実行
      const result = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
      )

      // 結果を検証
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeGreaterThanOrEqual(1)

      const item = result.items.find(
        (item) => item.dataSource.id === testDataSource.id,
      )
      expect(item).toBeDefined()
      expect(item?.dataSource.name).toBe("テストリポジトリ")
      // repositoryはdataSource内に内包されている
      const githubDataSource = item?.dataSource
      expect(githubDataSource?.repository.fullName).toBe("test/repository")
      expect(githubDataSource?.repository.owner).toBe("test")
      expect(githubDataSource?.repository.starsCount).toBe(100)
      expect(item?.userWatch.watchReleases).toBe(true)
      expect(item?.userWatch.watchIssues).toBe(false)
    })

    test("名前でフィルタリングが正常に動作する", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-2")

      // マッチするデータソース
      const matchingDataSource = await TestDataFactory.createTestDataSource({
        name: "React Library",
        sourceId: "react_match",
        sourceType: "github",
        repository: {
          fullName: "facebook/react",
          githubId: 10270250,
          language: "JavaScript",
          starsCount: 200000,
          forksCount: 50000,
          openIssuesCount: 500,
          isFork: false,
        },
      })

      // マッチしないデータソース
      const nonMatchingDataSource = await TestDataFactory.createTestDataSource({
        name: "Vue Framework",
        sourceId: "vue_nomatch",
        sourceType: "github",
        repository: {
          fullName: "vuejs/vue",
          githubId: 11730342,
          language: "JavaScript",
          starsCount: 180000,
          forksCount: 30000,
          openIssuesCount: 300,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(
        testUser.id,
        matchingDataSource.id,
      )

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        nonMatchingDataSource.id,
      )

      // 名前でフィルタリング
      const result = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          name: "React",
        },
      )

      expect(result.items.length).toBe(1)
      expect(result.items[0].dataSource.name).toBe("React Library")
    })

    test("オーナーでフィルタリングが正常に動作する", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-3")

      // マッチするデータソース
      const matchingDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        sourceId: "react_owner",
        sourceType: "github",
        repository: {
          fullName: "facebook/react",
          githubId: 10270250,
          language: "JavaScript",
          starsCount: 200000,
          forksCount: 50000,
          openIssuesCount: 500,
          isFork: false,
        },
      })

      // マッチしないデータソース
      const nonMatchingDataSource = await TestDataFactory.createTestDataSource({
        name: "Vue",
        sourceId: "vue_owner",
        sourceType: "github",
        repository: {
          fullName: "vuejs/vue",
          githubId: 11730342,
          language: "JavaScript",
          starsCount: 180000,
          forksCount: 30000,
          openIssuesCount: 300,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(
        testUser.id,
        matchingDataSource.id,
      )

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        nonMatchingDataSource.id,
      )

      // オーナーでフィルタリング
      const result = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          owner: "facebook",
        },
      )

      expect(result.items.length).toBe(1)
      const githubDataSource = result.items[0].dataSource
      expect(githubDataSource?.repository.owner).toBe("facebook")
    })

    test("フリーワード検索が正常に動作する", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-4")

      // マッチするデータソース
      const matchingDataSource = await TestDataFactory.createTestDataSource({
        name: "React",
        description: "JavaScript library for building user interfaces",
        sourceId: "react_search",
        sourceType: "github",
        repository: {
          fullName: "facebook/react",
          githubId: 10270250,
          language: "JavaScript",
          starsCount: 200000,
          forksCount: 50000,
          openIssuesCount: 500,
          isFork: false,
        },
      })

      // マッチしないデータソース
      const nonMatchingDataSource = await TestDataFactory.createTestDataSource({
        name: "Vue",
        description: "Progressive web framework",
        sourceId: "vue_search",
        sourceType: "github",
        repository: {
          fullName: "vuejs/vue",
          githubId: 11730342,
          language: "JavaScript",
          starsCount: 180000,
          forksCount: 30000,
          openIssuesCount: 300,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(
        testUser.id,
        matchingDataSource.id,
      )

      await TestDataFactory.createTestUserWatch(
        testUser.id,
        nonMatchingDataSource.id,
      )

      // フリーワード検索
      const result = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          search: "JavaScript",
        },
      )

      expect(result.items.length).toBe(1)
      expect(result.items[0].dataSource.description).toContain("JavaScript")
    })

    test("ソート機能が正常に動作する", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-5")

      // データソースを作成（名前順でソート確認）
      const dataSource1 = await TestDataFactory.createTestDataSource({
        name: "A Repository",
        sourceId: "a_repo",
        sourceType: "github",
        repository: {
          fullName: "test/a-repo",
          githubId: 1,
          starsCount: 100,
          language: "TypeScript",
          forksCount: 20,
          openIssuesCount: 5,
          isFork: false,
        },
      })

      const dataSource2 = await TestDataFactory.createTestDataSource({
        name: "B Repository",
        sourceId: "b_repo",
        sourceType: "github",
        repository: {
          fullName: "test/b-repo",
          githubId: 2,
          starsCount: 200,
          language: "JavaScript",
          forksCount: 40,
          openIssuesCount: 10,
          isFork: false,
        },
      })

      // ユーザーウォッチを作成
      await TestDataFactory.createTestUserWatch(testUser.id, dataSource1.id)

      await TestDataFactory.createTestUserWatch(testUser.id, dataSource2.id)

      // 名前で昇順ソート
      const ascResult = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          sortBy: "name",
          sortOrder: "asc",
        },
      )

      expect(ascResult.items.length).toBe(2)
      expect(ascResult.items[0].dataSource.name).toBe("A Repository")
      expect(ascResult.items[1].dataSource.name).toBe("B Repository")

      // スター数で降順ソート
      const descResult = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          sortBy: "starsCount",
          sortOrder: "desc",
        },
      )

      expect(descResult.items.length).toBe(2)
      const firstItem = descResult.items[0].dataSource
      const secondItem = descResult.items[1].dataSource
      expect(firstItem?.repository.starsCount).toBe(200)
      expect(secondItem?.repository.starsCount).toBe(100)
    })

    test("ページネーションが正常に動作する", async () => {
      // テストユーザーを作成
      const testUser = await TestDataFactory.createTestUser("test-user-6")

      // 複数のデータソースを作成
      const dataSources = []
      for (let i = 1; i <= 5; i++) {
        const dataSource = await TestDataFactory.createTestDataSource({
          name: `Repository ${i}`,
          sourceId: `repo_${i}`,
          sourceType: "github",
          repository: {
            fullName: `test/repo-${i}`,
            githubId: i,
            language: "TypeScript",
            starsCount: i * 10,
            forksCount: i * 2,
            openIssuesCount: i,
            isFork: false,
          },
        })
        dataSources.push(dataSource)

        await TestDataFactory.createTestUserWatch(testUser.id, dataSource.id)
      }

      // 1ページ目（2件）
      const page1 = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          limit: 2,
          offset: 0,
        },
      )

      expect(page1.items.length).toBe(2)
      expect(page1.total).toBe(5)

      // 2ページ目（2件）
      const page2 = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          limit: 2,
          offset: 2,
        },
      )

      expect(page2.items.length).toBe(2)
      expect(page2.total).toBe(5)

      // 3ページ目（1件）
      const page3 = await dataSourceRepository.findByUserWithFilters(
        testUser.id,
        {
          limit: 2,
          offset: 4,
        },
      )

      expect(page3.items.length).toBe(1)
      expect(page3.total).toBe(5)
    })

    test("空の結果が正常に返される", async () => {
      // 存在しないユーザーIDで検索
      const nonExistentUserId = uuidv7()

      const result =
        await dataSourceRepository.findByUserWithFilters(nonExistentUserId)

      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })
  })
})
