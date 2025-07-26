import { describe, test, beforeEach, afterEach, expect, vi } from "vitest"
import type { Context } from "aws-lambda"
import { handler } from "../handler"
import { setupComponentTest } from "../../../../../test"
import { DataSourceRepository } from "../../../../data-sources/repositories/data-source.repository"
import { RepositoryRepository } from "../../../../data-sources/repositories/repository.repository"
import { GitHubApiServiceStub } from "../../../../data-sources/services/github-api-service.stub"
import { EventRepository } from "../../../repositories"
import { EVENT_STATUS } from "../../../domain/event-status"
import { EVENT_TYPE } from "../../../domain/monitoring-types"

describe("detect-datasource-updates handler", () => {
  test("GitHub APIのIssue取得でエラーが起きた場合、DBにイベントが保存されない（ロールバックされる）", async () => {
    // Given: Releases/PRは正常、Issuesのみエラー
    githubApiStub.setStubReleases([
      {
        id: 1001,
        tag_name: "v1.0.0",
        name: "Version 1.0.0",
        body: "Initial release",
        draft: false,
        prerelease: false,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        html_url: "https://github.com/test-owner/test-repo/releases/tag/v1.0.0",
      },
    ])
    githubApiStub.setStubPullRequests([
      {
        id: 3001,
        number: 10,
        title: "Fix memory leak",
        body: "This fixes the memory leak",
        state: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        merged_at: null,
        html_url: "https://github.com/test-owner/test-repo/pull/10",
        user: {
          login: "contributor1",
          avatar_url: "https://github.com/contributor1.png",
        },
      },
    ])
    githubApiStub.setStubIssues({
      status: 500,
      message: "issues fetch error",
    })

    // When & Then: handler実行でエラーが発生し、DBにイベントが保存されていないこと
    await expect(
      handler({ dataSourceId: testDataSourceId }, mockContext),
    ).rejects.toThrow("issues fetch error")

    const events = await eventRepository.findByDataSourceAndStatus(
      testDataSourceId,
      EVENT_STATUS.PENDING,
    )
    expect(events).toHaveLength(0)
  })
  setupComponentTest()

  let dataSourceRepository: DataSourceRepository
  let repositoryRepository: RepositoryRepository
  let eventRepository: EventRepository
  let githubApiStub: GitHubApiServiceStub
  let mockContext: Context

  let testDataSourceId: string
  beforeEach(async () => {
    // 環境変数をstubEnvでセット
    vi.stubEnv("USE_GITHUB_API_STUB", "true")
    dataSourceRepository = new DataSourceRepository()
    repositoryRepository = new RepositoryRepository()
    eventRepository = new EventRepository()
    // GitHubApiServiceFactoryから同じインスタンスを取得
    const { createGitHubApiService } = await import(
      "../../../../data-sources/services/github-api-service.factory"
    )
    githubApiStub = createGitHubApiService() as GitHubApiServiceStub

    mockContext = {
      awsRequestId: "test-request-id",
    } as Context

    // テストデータのセットアップ
    const dataSource = await dataSourceRepository.save({
      sourceType: "github_repository",
      sourceId: "test-owner/test-repo",
      name: "Test Repository",
      description: "Test repository for monitoring",
      url: "https://github.com/test-owner/test-repo",
      isPrivate: false,
    })
    testDataSourceId = dataSource.id

    await repositoryRepository.save({
      dataSourceId: testDataSourceId,
      githubId: 123456,
      fullName: "test-owner/test-repo",
      language: "TypeScript",
      starsCount: 100,
      forksCount: 20,
      openIssuesCount: 5,
      isFork: false,
    })

    // スタブをリセット
    githubApiStub.resetStubs()
  })

  afterEach(() => {
    // 環境変数をstubEnvでクリア
    vi.unstubAllEnvs()
  })

  test("初回実行時は7日前からの更新を取得して保存する", async () => {
    // Given: スタブデータを設定
    const now = new Date()
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

    githubApiStub.setStubReleases([
      {
        id: 1001,
        tag_name: "v1.0.0",
        name: "Version 1.0.0",
        body: "Initial release",
        draft: false,
        prerelease: false,
        created_at: fiveDaysAgo.toISOString(),
        published_at: fiveDaysAgo.toISOString(),
        html_url: "https://github.com/test-owner/test-repo/releases/tag/v1.0.0",
      },
      {
        id: 1002,
        tag_name: "v0.9.0",
        name: "Version 0.9.0",
        body: "Old release",
        draft: false,
        prerelease: false,
        created_at: tenDaysAgo.toISOString(),
        published_at: tenDaysAgo.toISOString(),
        html_url: "https://github.com/test-owner/test-repo/releases/tag/v0.9.0",
      },
    ])

    githubApiStub.setStubIssues([
      {
        id: 2001,
        number: 1,
        title: "New bug report",
        body: "Something is broken",
        state: "open",
        created_at: fiveDaysAgo.toISOString(),
        updated_at: fiveDaysAgo.toISOString(),
        closed_at: null,
        html_url: "https://github.com/test-owner/test-repo/issues/1",
        user: { login: "user1", avatar_url: "https://github.com/user1.png" },
      },
    ])

    githubApiStub.setStubPullRequests([
      {
        id: 3001,
        number: 10,
        title: "Fix memory leak",
        body: "This fixes the memory leak",
        state: "open",
        created_at: fiveDaysAgo.toISOString(),
        updated_at: fiveDaysAgo.toISOString(),
        closed_at: null,
        merged_at: null,
        html_url: "https://github.com/test-owner/test-repo/pull/10",
        user: {
          login: "contributor1",
          avatar_url: "https://github.com/contributor1.png",
        },
      },
    ])

    // When: ハンドラーを実行
    const result = await handler(
      { dataSourceId: testDataSourceId },
      mockContext,
    )

    // Then: 新規イベントが作成されていることを確認
    expect(result.newEventIds).toHaveLength(3) // Release1個、Issue1個、PR1個

    // 保存されたイベントを確認
    const releases = await eventRepository.findByDataSourceAndStatus(
      testDataSourceId,
      EVENT_STATUS.PENDING,
    )

    const savedRelease = releases.find(
      (e) => e.eventType === EVENT_TYPE.RELEASE && e.githubEventId === "1001",
    )
    expect(savedRelease).toBeDefined()
    expect(savedRelease?.title).toBe("Version 1.0.0")
    expect(savedRelease?.version).toBe("v1.0.0")

    const savedIssue = releases.find(
      (e) => e.eventType === EVENT_TYPE.ISSUE && e.githubEventId === "2001",
    )
    expect(savedIssue).toBeDefined()
    expect(savedIssue?.title).toBe("New bug report")

    const savedPR = releases.find(
      (e) =>
        e.eventType === EVENT_TYPE.PULL_REQUEST && e.githubEventId === "3001",
    )
    expect(savedPR).toBeDefined()
    expect(savedPR?.title).toBe("Fix memory leak")

    // 10日前のリリースは含まれないことを確認
    const oldRelease = releases.find((e) => e.githubEventId === "1002")
    expect(oldRelease).toBeUndefined()
  })

  test("2回目以降の実行時は前回チェック時刻以降の更新のみを取得する", async () => {
    // Given: 既存のイベントを作成（前回実行時のもの）
    const threeDaysAgo = new Date(
      new Date().getTime() - 3 * 24 * 60 * 60 * 1000,
    )
    await eventRepository.upsert({
      id: "8e04ab78-4fc7-4618-ae25-4009ceae6bb8",
      dataSourceId: testDataSourceId,
      githubEventId: "9999",
      eventType: EVENT_TYPE.RELEASE,
      title: "Old Release",
      body: "Previous release",
      version: "v0.1.0",
      status: EVENT_STATUS.COMPLETED,
      createdAt: threeDaysAgo,
    })

    // 新しいデータをスタブに設定
    const oneDayAgo = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    const fiveDaysAgo = new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000)

    // 他のAPIコールは空の結果を返すように設定
    githubApiStub.setStubReleases([])
    githubApiStub.setStubPullRequests([])

    githubApiStub.setStubIssues([
      {
        id: 2002,
        number: 2,
        title: "New issue after last check",
        body: "This is new",
        state: "open",
        created_at: oneDayAgo.toISOString(),
        updated_at: oneDayAgo.toISOString(),
        closed_at: null,
        html_url: "https://github.com/test-owner/test-repo/issues/2",
        user: { login: "user2", avatar_url: "https://github.com/user2.png" },
      },
      {
        id: 2003,
        number: 3,
        title: "Old issue before last check",
        body: "This is old",
        state: "open",
        created_at: fiveDaysAgo.toISOString(),
        updated_at: fiveDaysAgo.toISOString(),
        closed_at: null,
        html_url: "https://github.com/test-owner/test-repo/issues/3",
        user: { login: "user3", avatar_url: "https://github.com/user3.png" },
      },
    ])

    // When: ハンドラーを実行
    const result = await handler(
      { dataSourceId: testDataSourceId },
      mockContext,
    )

    // Then: 新しいイベントのみが作成されていることを確認
    expect(result.newEventIds).toHaveLength(1)

    const events = await eventRepository.findByDataSourceAndStatus(
      testDataSourceId,
      EVENT_STATUS.PENDING,
    )

    const newIssue = events.find((e) => e.githubEventId === "2002")
    expect(newIssue).toBeDefined()
    expect(newIssue?.title).toBe("New issue after last check")

    // 古いイベントは含まれないことを確認
    const oldIssue = events.find((e) => e.githubEventId === "2003")
    expect(oldIssue).toBeUndefined()
  })

  test("重複実行時は冪等性が保たれる", async () => {
    // Given: イベントデータをスタブに設定
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    // 他のAPIコールは空の結果を返すように設定
    githubApiStub.setStubIssues([])
    githubApiStub.setStubPullRequests([])

    githubApiStub.setStubReleases([
      {
        id: 1003,
        tag_name: "v2.0.0",
        name: "Version 2.0.0",
        body: "Major release",
        draft: false,
        prerelease: false,
        created_at: twoDaysAgo.toISOString(),
        published_at: twoDaysAgo.toISOString(),
        html_url: "https://github.com/test-owner/test-repo/releases/tag/v2.0.0",
      },
    ])

    // When: 1回目の実行
    const result1 = await handler(
      { dataSourceId: testDataSourceId },
      mockContext,
    )

    // Then: 1件作成される
    expect(result1.newEventIds).toHaveLength(1)

    // When: 2回目の実行（同じデータ）
    const result2 = await handler(
      { dataSourceId: testDataSourceId },
      mockContext,
    )

    // Then: 新規作成は0件（既存データは更新される）
    expect(result2.newEventIds).toHaveLength(0)

    // イベントが重複していないことを確認
    const events = await eventRepository.findByDataSourceAndStatus(
      testDataSourceId,
      EVENT_STATUS.PENDING,
    )
    const v2Releases = events.filter((e) => e.githubEventId === "1003")
    expect(v2Releases).toHaveLength(1)
  })

  test("データソースが存在しない場合はエラーを投げる", async () => {
    // When & Then: 存在しないデータソースIDでエラーが発生することを確認
    await expect(
      handler({ dataSourceId: "non-existent-id" }, mockContext),
    ).rejects.toThrow()
  })

  test("リポジトリ情報が存在しない場合はエラーを投げる", async () => {
    // Given: リポジトリ情報のないデータソースを作成
    const dataSourceWithoutRepo = await dataSourceRepository.save({
      sourceType: "github_repository",
      sourceId: "no-repo/test",
      name: "No Repository",
      description: "Data source without repository",
      url: "https://github.com/no-repo/test",
      isPrivate: false,
    })

    // When & Then: リポジトリ情報がないためエラーが発生することを確認
    await expect(
      handler({ dataSourceId: dataSourceWithoutRepo.id }, mockContext),
    ).rejects.toThrow()
  })

  test("GitHub APIエラー時は適切にエラーハンドリングする", async () => {
    // Given: GitHub APIエラーを設定
    githubApiStub.setStubResponse({
      status: 403,
      message: "API rate limit exceeded",
    })

    // When & Then: GitHub APIエラーが適切に伝播されることを確認
    await expect(
      handler({ dataSourceId: testDataSourceId }, mockContext),
    ).rejects.toThrow()
  })

  test("入力パラメータが不正な場合はエラーを投げる", async () => {
    // When & Then: dataSourceIdがない場合
    const invalidInput = {} as unknown as { dataSourceId: string }
    await expect(handler(invalidInput, mockContext)).rejects.toThrow(
      "Invalid input parameters",
    )

    // When & Then: dataSourceIdが空文字の場合
    await expect(handler({ dataSourceId: "" }, mockContext)).rejects.toThrow(
      "Invalid input parameters",
    )
  })
})
