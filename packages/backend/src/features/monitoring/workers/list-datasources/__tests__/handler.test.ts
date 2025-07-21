import { describe, test, beforeEach, expect } from "vitest"

import { handler } from "../handler"
import { DataSourceRepository } from "../../../../data-sources/repositories/data-source.repository"
import type { Context } from "aws-lambda"
import { setupComponentTest } from "../../../../../test"

describe("list-datasources handler", () => {
  setupComponentTest()

  let dataSourceRepository: DataSourceRepository
  let mockContext: Context

  beforeEach(async () => {
    dataSourceRepository = new DataSourceRepository()
    mockContext = {
      awsRequestId: "test-request-id",
    } as Context
  })

  test("データソースタイプを指定しない場合、全てのデータソースを取得する", async () => {
    // Given: テストデータをセットアップ
    const testDataSource = await dataSourceRepository.save({
      sourceType: "github_repository",
      sourceId: "test/repo",
      name: "Test Repository",
      description: "Test repository for monitoring",
      url: "https://github.com/test/repo",
      isPrivate: false,
    })

    // When: ハンドラーを実行
    const result = await handler({}, mockContext)

    // Then: 結果を検証
    expect(result.dataSources).toHaveLength(1)
    expect(result.dataSources[0]).toEqual({
      id: testDataSource.id,
      sourceType: "github_repository",
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
    await dataSourceRepository.save({
      sourceType: "github_repository",
      sourceId: "test/repo1",
      name: "Test Repository 1",
      description: "Test repository 1 for monitoring",
      url: "https://github.com/test/repo1",
      isPrivate: false,
    })

    await dataSourceRepository.save({
      sourceType: "npm_package",
      sourceId: "test-package",
      name: "Test Package",
      description: "Test package for monitoring",
      url: "https://www.npmjs.com/package/test-package",
      isPrivate: false,
    })

    // When: GitHub repositoryタイプのみを指定してハンドラーを実行
    const result = await handler(
      { sourceType: "github_repository" },
      mockContext,
    )

    // Then: GitHub repositoryタイプのみが返されることを検証
    expect(result.dataSources).toHaveLength(1)
    expect(result.dataSources[0].sourceType).toBe("github_repository")
    expect(result.dataSources[0].sourceId).toBe("test/repo1")
  })

  test("データソースが存在しない場合、空の配列を返す", async () => {
    // When: データソースが存在しない状態でハンドラーを実行
    const result = await handler({}, mockContext)

    // Then: 空の配列が返されることを検証
    expect(result.dataSources).toHaveLength(0)
    expect(result.dataSources).toEqual([])
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
