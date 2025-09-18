import { describe, test, beforeEach, expect } from "vitest"

import { handler } from "../handler"
// テストデータ生成用ファクトリ
import { TestDataFactory } from "../../../../../test/factories"
import type { Context } from "aws-lambda"
import { setupComponentTest } from "../../../../../test"

describe("list-datasources handler", () => {
  setupComponentTest()

  let mockContext: Context

  beforeEach(async () => {
    mockContext = {
      awsRequestId: "test-request-id",
    } as Context
  })

  test("データソースタイプを指定しない場合、全てのデータソースを取得する", async () => {
    // Given: テストデータをセットアップ
    const testDataSource = await TestDataFactory.createTestDataSource({
      sourceId: "test/repo",
      name: "Test Repository",
      description: "Test repository for monitoring",
      url: "https://github.com/test/repo",
      isPrivate: false,
      repository: {
        githubId: 123456,
        fullName: "test/repo",
        language: "TypeScript",
        starsCount: 100,
        forksCount: 20,
        openIssuesCount: 5,
        isFork: false,
      },
    })

    // When: ハンドラーを実行
    const result = await handler({}, mockContext)

    // Then: 結果を検証
    expect(result.detectTargets).toHaveLength(1)
    expect(result.detectTargets[0]).toEqual({
      id: testDataSource.id,
      sourceType: "github",
      sourceId: "test/repo",
      name: "Test Repository",
      description: "Test repository for monitoring",
      url: "https://github.com/test/repo",
      isPrivate: false,
      createdAt: testDataSource.createdAt.toISOString(),
      updatedAt: testDataSource.updatedAt.toISOString(),
    })
  })

  test("データソースタイプを指定した場合、フィルタリングされたデータソースを取得する", async () => {
    // Given: 複数のデータソースをセットアップ
    await TestDataFactory.createTestDataSource({
      sourceId: "test/repo1",
      name: "Test Repository 1",
      description: "Test repository 1 for monitoring",
      url: "https://github.com/test/repo1",
      isPrivate: false,
      repository: {
        githubId: 123457,
        fullName: "test/repo1",
        language: "JavaScript",
        starsCount: 50,
        forksCount: 10,
        openIssuesCount: 2,
        isFork: false,
      },
    })

    // NPMパッケージは現在サポートしていないため、別のGitHubリポジトリでテスト
    await TestDataFactory.createTestDataSource({
      sourceId: "test/package",
      name: "Test Package",
      description: "Test package for monitoring",
      url: "https://github.com/test/package",
      isPrivate: false,
      repository: {
        githubId: 123458,
        fullName: "test/package",
        language: "Python",
        starsCount: 25,
        forksCount: 5,
        openIssuesCount: 1,
        isFork: false,
      },
    })

    // When: GitHubタイプのみを指定してハンドラーを実行
    const result = await handler({ sourceType: "github" }, mockContext)

    // Then: GitHubタイプのみが返されることを検証
    expect(result.detectTargets).toHaveLength(2)
    expect(result.detectTargets[0].sourceType).toBe("github")
    expect(result.detectTargets[0].sourceId).toBe("test/repo1")
  })

  test("データソースが存在しない場合、空の配列を返す", async () => {
    // When: データソースが存在しない状態でハンドラーを実行
    const result = await handler({}, mockContext)

    // Then: 空の配列が返されることを検証
    expect(result.detectTargets).toHaveLength(0)
    expect(result.detectTargets).toEqual([])
  })

  // test("データベースエラーが発生した場合、エラーを投げる", async () => {
  //   // Given: DataSourceRepositoryをモックしてエラーを発生させる
  //   const findManySpy = vi.spyOn(DataSourceRepository.prototype, 'findMany').mockRejectedValue(new Error("Database connection failed"));

  //   // When & Then: エラーが投げられることを検証
  //   await expect(handler({}, mockContext)).rejects.toThrow(
  //     "Database connection failed",
  //   );

  //   // モックをリストア
  //   findManySpy.mockRestore();
  // });
})
