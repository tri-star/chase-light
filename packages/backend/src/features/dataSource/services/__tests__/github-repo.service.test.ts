import { describe, test, expect, beforeEach } from "vitest"
import { GitHubRepoServiceStub } from "./github-repo.service.stub"
import { TestDataBuilder } from "./test-data-builder"
import type { IGitHubRepoService } from "../github-repo.service.interface"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
  GitHubIssueOptions,
} from "../../types"

/**
 * GitHubRepoService Unit Tests
 *
 * ADR003準拠のスタブベーステスト
 * 日本語でのテスト記述、Parameterized testを活用
 */
describe("GitHubRepoService", () => {
  let githubService: IGitHubRepoService
  let stubService: GitHubRepoServiceStub

  beforeEach(() => {
    stubService = new GitHubRepoServiceStub()
    githubService = stubService
    stubService.reset()
  })

  describe("getWatchedRepositories", () => {
    test("ユーザーのwatch済みリポジトリを正常に取得できる", async () => {
      // Arrange: テストデータを設定
      const expectedRepositories = TestDataBuilder.createRepositoryList(3)
      stubService.setWatchedRepositories(expectedRepositories)

      // Act
      const repositories =
        await githubService.getWatchedRepositories("testuser")

      // Assert
      expect(repositories).toHaveLength(3)
      expect(repositories).toEqual(expectedRepositories)
      expect(repositories[0].name).toBe("repo-1")
      expect(repositories[1].name).toBe("repo-2")
      expect(repositories[2].name).toBe("repo-3")
    })

    test("空のリポジトリリストを正常に処理できる", async () => {
      // Arrange: 空のリストを設定
      stubService.setWatchedRepositories([])

      // Act
      const repositories =
        await githubService.getWatchedRepositories("testuser")

      // Assert
      expect(repositories).toHaveLength(0)
      expect(repositories).toEqual([])
    })

    test("大量のリポジトリデータを正常に処理できる", async () => {
      // Arrange: 大量データを設定
      const largeRepositoryList = TestDataBuilder.createLargeRepositoryList(100)
      stubService.setWatchedRepositories(largeRepositoryList)

      // Act
      const repositories =
        await githubService.getWatchedRepositories("testuser")

      // Assert
      expect(repositories).toHaveLength(100)
      expect(repositories[0].id).toBe(1)
      expect(repositories[99].id).toBe(100)
    })

    test.each([
      ["認証エラー", new GitHubAuthenticationError("Invalid token")],
      [
        "レート制限エラー",
        new GitHubRateLimitError("Rate limit exceeded", new Date(), 0),
      ],
      ["一般的なAPIエラー", new GitHubApiError("Server error", 500)],
      ["ネットワークエラー", new Error("Network timeout")],
    ])("%s が適切に処理される", async (_errorType, error) => {
      // Arrange
      stubService.setErrorForMethod("getWatchedRepositories", error)

      // Act & Assert
      await expect(
        githubService.getWatchedRepositories("testuser"),
      ).rejects.toThrow(error.message)
    })
  })

  describe("getRepositoryDetails", () => {
    test("指定したリポジトリの詳細情報を正常に取得できる", async () => {
      // Arrange
      const expectedRepository = TestDataBuilder.createRepository({
        name: "specific-repo",
        fullName: "testuser/specific-repo",
        description: "A specific repository for testing",
      })
      stubService.setRepositoryDetails(
        "testuser",
        "specific-repo",
        expectedRepository,
      )

      // Act
      const repository = await githubService.getRepositoryDetails(
        "testuser",
        "specific-repo",
      )

      // Assert
      expect(repository).toEqual(expectedRepository)
      expect(repository.name).toBe("specific-repo")
      expect(repository.description).toBe("A specific repository for testing")
    })

    test("存在しないリポジトリの場合はエラーをスローする", async () => {
      // Act & Assert
      await expect(
        githubService.getRepositoryDetails("testuser", "non-existent-repo"),
      ).rejects.toThrow("Repository testuser/non-existent-repo not found")
    })

    test.each([
      ["testuser", "repo-1"],
      ["another-user", "another-repo"],
      ["org", "project"],
    ])("異なるオーナーとリポジトリの組み合わせ: %s/%s", async (owner, repo) => {
      // Arrange
      const expectedRepository = TestDataBuilder.createRepository({
        name: repo,
        fullName: `${owner}/${repo}`,
        owner: TestDataBuilder.createRepositoryOwner({ login: owner }),
      })
      stubService.setRepositoryDetails(owner, repo, expectedRepository)

      // Act
      const repository = await githubService.getRepositoryDetails(owner, repo)

      // Assert
      expect(repository.name).toBe(repo)
      expect(repository.fullName).toBe(`${owner}/${repo}`)
      expect(repository.owner.login).toBe(owner)
    })
  })

  describe("getRepositoryReleases", () => {
    test("指定したリポジトリのリリース一覧を正常に取得できる", async () => {
      // Arrange
      const expectedReleases = TestDataBuilder.createReleaseList(3)
      stubService.setRepositoryReleases(
        "testuser",
        "test-repo",
        expectedReleases,
      )

      // Act
      const releases = await githubService.getRepositoryReleases(
        "testuser",
        "test-repo",
      )

      // Assert
      expect(releases).toHaveLength(3)
      expect(releases).toEqual(expectedReleases)
      expect(releases[0].tagName).toBe("v1.0.0")
      expect(releases[1].tagName).toBe("v1.1.0")
      expect(releases[2].tagName).toBe("v1.2.0")
    })

    test("リリースが存在しないリポジトリでは空配列を返す", async () => {
      // Act (何も設定しない = リリースなし)
      const releases = await githubService.getRepositoryReleases(
        "testuser",
        "empty-repo",
      )

      // Assert
      expect(releases).toHaveLength(0)
      expect(releases).toEqual([])
    })

    test.each([
      [1, 10, "ページ1、10件ずつ"],
      [2, 5, "ページ2、5件ずつ"],
      [1, 1, "ページ1、1件ずつ"],
    ])(
      "ページネーション: %i ページ目、%i 件表示 (%s)",
      async (page, perPage, _description) => {
        // Arrange: 15件のリリースを設定
        const allReleases = TestDataBuilder.createReleaseList(15)
        stubService.setRepositoryReleases("testuser", "test-repo", allReleases)

        // Act
        const releases = await githubService.getRepositoryReleases(
          "testuser",
          "test-repo",
          { page, perPage },
        )

        // Assert
        expect(releases).toHaveLength(
          Math.min(
            perPage,
            Math.max(0, allReleases.length - (page - 1) * perPage),
          ),
        )

        if (releases.length > 0) {
          const expectedStartIndex = (page - 1) * perPage
          expect(releases[0].id).toBe(allReleases[expectedStartIndex].id)
        }
      },
    )
  })

  describe("getRepositoryPullRequests", () => {
    test("指定したリポジトリのPull Request一覧を正常に取得できる", async () => {
      // Arrange
      const expectedPullRequests = TestDataBuilder.createPullRequestList(2)
      stubService.setRepositoryPullRequests(
        "testuser",
        "test-repo",
        expectedPullRequests,
      )

      // Act
      const pullRequests = await githubService.getRepositoryPullRequests(
        "testuser",
        "test-repo",
      )

      // Assert
      expect(pullRequests).toHaveLength(2)
      expect(pullRequests).toEqual(expectedPullRequests)
      expect(pullRequests[0].number).toBe(1)
      expect(pullRequests[1].number).toBe(2)
    })

    test.each([
      ["open", "オープン状態のPRのみ"],
      ["closed", "クローズ状態のPRのみ"],
      ["all", "全てのPRの状態"],
    ])("stateフィルタリング: %s (%s)", async (state, _description) => {
      // Arrange: 混在状態のPRを設定
      const mixedPullRequests = TestDataBuilder.createMixedStatePullRequests()
      stubService.setRepositoryPullRequests(
        "testuser",
        "test-repo",
        mixedPullRequests,
      )

      // Act
      const pullRequests = await githubService.getRepositoryPullRequests(
        "testuser",
        "test-repo",
        {
          state: state as "open" | "closed" | "all",
        },
      )

      // Assert
      if (state === "all") {
        expect(pullRequests).toHaveLength(3) // 全てのPR
      } else {
        expect(pullRequests.every((pr) => pr.state === state)).toBe(true)
      }
    })

    test("Pull Requestが存在しないリポジトリでは空配列を返す", async () => {
      // Act
      const pullRequests = await githubService.getRepositoryPullRequests(
        "testuser",
        "empty-repo",
      )

      // Assert
      expect(pullRequests).toHaveLength(0)
    })
  })

  describe("getRepositoryIssues", () => {
    test("指定したリポジトリのIssue一覧を正常に取得できる", async () => {
      // Arrange
      const expectedIssues = TestDataBuilder.createIssueList(2)
      stubService.setRepositoryIssues("testuser", "test-repo", expectedIssues)

      // Act
      const issues = await githubService.getRepositoryIssues(
        "testuser",
        "test-repo",
      )

      // Assert
      expect(issues).toHaveLength(2)
      expect(issues).toEqual(expectedIssues)
      expect(issues[0].number).toBe(1)
      expect(issues[1].number).toBe(2)
    })

    test.each([
      ["open", "オープン状態のIssueのみ"],
      ["closed", "クローズ状態のIssueのみ"],
      ["all", "全てのIssueの状態"],
    ])("stateフィルタリング: %s (%s)", async (state, _description) => {
      // Arrange: 混在状態のIssueを設定
      const mixedIssues = TestDataBuilder.createMixedStateIssues()
      stubService.setRepositoryIssues("testuser", "test-repo", mixedIssues)

      // Act
      const issues = await githubService.getRepositoryIssues(
        "testuser",
        "test-repo",
        {
          state: state as "open" | "closed" | "all",
        },
      )

      // Assert
      if (state === "all") {
        expect(issues).toHaveLength(2) // 全てのIssue
      } else {
        expect(issues.every((issue) => issue.state === state)).toBe(true)
      }
    })

    test("sinceフィルタリングが正常に動作する", async () => {
      // Arrange: 異なる作成日時のIssueを設定
      const issues = [
        TestDataBuilder.createIssue({ createdAt: "2024-01-01T00:00:00Z" }),
        TestDataBuilder.createIssue({ createdAt: "2024-02-01T00:00:00Z" }),
        TestDataBuilder.createIssue({ createdAt: "2024-03-01T00:00:00Z" }),
      ]
      stubService.setRepositoryIssues("testuser", "test-repo", issues)

      // Act: 2024年2月以降のIssueを取得
      const filteredIssues = await githubService.getRepositoryIssues(
        "testuser",
        "test-repo",
        {
          since: "2024-02-01T00:00:00Z",
        } as GitHubIssueOptions,
      )

      // Assert
      expect(filteredIssues).toHaveLength(2) // 2月と3月のIssue
      expect(
        filteredIssues.every(
          (issue) =>
            new Date(issue.createdAt) >= new Date("2024-02-01T00:00:00Z"),
        ),
      ).toBe(true)
    })

    test("Issueが存在しないリポジトリでは空配列を返す", async () => {
      // Act
      const issues = await githubService.getRepositoryIssues(
        "testuser",
        "empty-repo",
      )

      // Assert
      expect(issues).toHaveLength(0)
    })
  })

  describe("境界値テスト", () => {
    test.each([
      [null, "nullユーザー名での呼び出し"],
      [undefined, "undefinedユーザー名での呼び出し"],
      ["", "空文字ユーザー名での呼び出し"],
      ["user-with-special-chars!@#", "特殊文字を含むユーザー名での呼び出し"],
    ])("getWatchedRepositories: %s - %s", async (username, _description) => {
      // Note: _description parameter is used only for test case naming
      // Arrange
      stubService.setWatchedRepositories([])

      // Act & Assert
      // null/undefinedの場合は実際の実装に依存するが、スタブでは文字列として処理
      const result = await githubService.getWatchedRepositories(
        username as string,
      )
      expect(result).toEqual([])
    })

    test.each([
      [0, "ページ0での呼び出し"],
      [-1, "負のページ番号での呼び出し"],
      [999999, "非常に大きなページ番号での呼び出し"],
    ])(
      "getRepositoryReleases ページネーション境界値: page=%i (%s)",
      async (page, _description) => {
        // Note: _description parameter is used only for test case naming
        // Arrange
        const releases = TestDataBuilder.createReleaseList(5)
        stubService.setRepositoryReleases("testuser", "test-repo", releases)

        // Act
        const result = await githubService.getRepositoryReleases(
          "testuser",
          "test-repo",
          { page },
        )

        // Assert: 境界値でも例外は発生しない（空配列か部分的な結果）
        expect(Array.isArray(result)).toBe(true)
      },
    )
  })

  describe("エラーハンドリング", () => {
    test("複数のメソッドで同時にエラーが発生する場合", async () => {
      // Arrange: 複数メソッドにエラーを設定
      const apiError = new GitHubApiError("Service unavailable", 503)
      stubService.setErrorForMethod("getWatchedRepositories", apiError)
      stubService.setErrorForMethod("getRepositoryReleases", apiError)

      // Act & Assert
      await expect(
        githubService.getWatchedRepositories("testuser"),
      ).rejects.toThrow("Service unavailable")
      await expect(
        githubService.getRepositoryReleases("testuser", "test-repo"),
      ).rejects.toThrow("Service unavailable")
    })

    test("エラーをクリアした後は正常動作に戻る", async () => {
      // Arrange: エラーを設定してからクリア
      stubService.setErrorForMethod(
        "getWatchedRepositories",
        new Error("Temporary error"),
      )
      stubService.clearErrors()
      stubService.setWatchedRepositories(
        TestDataBuilder.createRepositoryList(1),
      )

      // Act & Assert: エラーが発生せずに正常動作
      const repositories =
        await githubService.getWatchedRepositories("testuser")
      expect(repositories).toHaveLength(1)
    })
  })

  describe("パフォーマンステスト", () => {
    test("実行時間の遅延シミュレーション", async () => {
      // Arrange: 100msの遅延を設定
      stubService.setExecutionDelay(100)
      stubService.setWatchedRepositories([])

      // Act
      const startTime = Date.now()
      await githubService.getWatchedRepositories("testuser")
      const endTime = Date.now()

      // Assert: 遅延が適用されている
      expect(endTime - startTime).toBeGreaterThanOrEqual(90) // 多少の誤差を考慮
    })
  })

  describe("スタブ設定の検証", () => {
    test("スタブの設定状況を確認できる", () => {
      // Arrange: 各種データを設定
      stubService.setWatchedRepositories(
        TestDataBuilder.createRepositoryList(2),
      )
      stubService.setRepositoryReleases(
        "testuser",
        "repo1",
        TestDataBuilder.createReleaseList(3),
      )
      stubService.setErrorForMethod(
        "getRepositoryDetails",
        new Error("Test error"),
      )
      stubService.setExecutionDelay(50)

      // Act
      const summary = stubService.getSetupSummary()

      // Assert
      expect(summary.watchedRepositoriesCount).toBe(2)
      expect(summary.releasesCount).toBe(1)
      expect(summary.errorMethods).toContain("getRepositoryDetails")
      expect(summary.executionDelay).toBe(50)
    })

    test("リセット後は全ての設定がクリアされる", () => {
      // Arrange: データを設定してからリセット
      stubService.setWatchedRepositories(
        TestDataBuilder.createRepositoryList(5),
      )
      stubService.setErrorForMethod("getWatchedRepositories", new Error("Test"))
      stubService.reset()

      // Act
      const summary = stubService.getSetupSummary()

      // Assert: 全てがクリアされている
      expect(summary.watchedRepositoriesCount).toBe(0)
      expect(summary.releasesCount).toBe(0)
      expect(summary.errorMethods).toHaveLength(0)
      expect(summary.executionDelay).toBe(0)
    })
  })
})
