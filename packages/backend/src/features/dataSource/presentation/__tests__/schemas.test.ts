import { describe, test, expect } from "vitest"
import {
  dataSourceSchemas,
  mapToGitHubApiOptions,
  mapToGitHubPullRequestOptions,
  mapToGitHubIssueOptions,
} from "../schemas"

describe("DataSource Schemas", () => {
  describe("usernameParams", () => {
    test("有効なGitHubユーザー名を受け入れる", () => {
      const validUsernames = [
        "octocat",
        "github",
        "user123",
        "my-username",
        "a",
      ]

      for (const username of validUsernames) {
        const result = dataSourceSchemas.usernameParams.safeParse({ username })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.username).toBe(username)
        }
      }
    })

    test("無効なGitHubユーザー名を拒否する", () => {
      const invalidUsernames = [
        "", // 空文字
        "-leading-dash", // 先頭にダッシュ
        "trailing-dash-", // 末尾にダッシュ
        "double--dash", // 連続ダッシュ
        "special!char", // 特殊文字
        "a".repeat(40), // 40文字（上限は39）
      ]

      for (const username of invalidUsernames) {
        const result = dataSourceSchemas.usernameParams.safeParse({ username })
        expect(result.success).toBe(false)
      }
    })
  })

  describe("repositoryParams", () => {
    test("有効なリポジトリパラメータを受け入れる", () => {
      const validParams = [
        { owner: "octocat", repo: "Hello-World" },
        { owner: "github", repo: "docs" },
        { owner: "user", repo: "test-repo_123" },
        { owner: "org", repo: "project.config" },
      ]

      for (const params of validParams) {
        const result = dataSourceSchemas.repositoryParams.safeParse(params)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(params)
        }
      }
    })

    test("無効なリポジトリパラメータを拒否する", () => {
      const invalidParams = [
        { owner: "", repo: "test" }, // 空のオーナー
        { owner: "test", repo: "" }, // 空のリポジトリ名
        { owner: "invalid owner", repo: "test" }, // スペース入りオーナー
        { owner: "test", repo: "invalid repo" }, // スペース入りリポジトリ名
        { owner: "a".repeat(40), repo: "test" }, // 長すぎるオーナー名
        { owner: "test", repo: "a".repeat(101) }, // 長すぎるリポジトリ名
      ]

      for (const params of invalidParams) {
        const result = dataSourceSchemas.repositoryParams.safeParse(params)
        expect(result.success).toBe(false)
      }
    })
  })

  describe("basicPaginationQuery", () => {
    test("有効なページングパラメータを受け入れて変換する", () => {
      const testCases = [
        { input: {}, expected: { page: 1, perPage: 30 } }, // デフォルト値
        { input: { page: "5" }, expected: { page: 5, perPage: 30 } },
        { input: { perPage: "50" }, expected: { page: 1, perPage: 50 } },
        {
          input: { page: "2", perPage: "10" },
          expected: { page: 2, perPage: 10 },
        },
      ]

      for (const { input, expected } of testCases) {
        const result = dataSourceSchemas.basicPaginationQuery.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(expected)
        }
      }
    })

    test("無効なページングパラメータを拒否する", () => {
      const invalidInputs = [
        { page: "0" }, // 0以下のページ
        { page: "101" }, // 100超のページ
        { perPage: "0" }, // 0以下のperPage
        { perPage: "101" }, // 100超のperPage
        { page: "abc" }, // 非数値
        { perPage: "xyz" }, // 非数値
      ]

      for (const input of invalidInputs) {
        const result = dataSourceSchemas.basicPaginationQuery.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })

  describe("pullRequestQuery", () => {
    test("有効なPull Requestクエリパラメータを受け入れる", () => {
      const testCases = [
        {
          input: {},
          expected: {
            page: 1,
            perPage: 30,
            state: "open",
            sort: "created",
            direction: "desc",
          },
        },
        {
          input: { state: "closed", sort: "updated", direction: "asc" },
          expected: {
            page: 1,
            perPage: 30,
            state: "closed",
            sort: "updated",
            direction: "asc",
          },
        },
        {
          input: { state: "all", sort: "popularity" },
          expected: {
            page: 1,
            perPage: 30,
            state: "all",
            sort: "popularity",
            direction: "desc",
          },
        },
      ]

      for (const { input, expected } of testCases) {
        const result = dataSourceSchemas.pullRequestQuery.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(expected)
        }
      }
    })

    test("無効なPull Requestクエリパラメータを拒否する", () => {
      const invalidInputs = [
        { state: "invalid" },
        { sort: "invalid" },
        { direction: "invalid" },
      ]

      for (const input of invalidInputs) {
        const result = dataSourceSchemas.pullRequestQuery.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })

  describe("issueQuery", () => {
    test("有効なIssueクエリパラメータを受け入れる", () => {
      const testCases = [
        {
          input: {},
          expected: {
            page: 1,
            perPage: 30,
            state: "open",
            sort: "created",
            direction: "desc",
          },
        },
        {
          input: { since: "2023-01-01T00:00:00Z" },
          expected: {
            page: 1,
            perPage: 30,
            state: "open",
            sort: "created",
            direction: "desc",
            since: "2023-01-01T00:00:00Z",
          },
        },
        {
          input: { state: "closed", sort: "comments" },
          expected: {
            page: 1,
            perPage: 30,
            state: "closed",
            sort: "comments",
            direction: "desc",
          },
        },
      ]

      for (const { input, expected } of testCases) {
        const result = dataSourceSchemas.issueQuery.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(expected)
        }
      }
    })

    test("無効なIssueクエリパラメータを拒否する", () => {
      const invalidInputs = [
        { since: "invalid-date" },
        { state: "invalid" },
        { sort: "invalid" },
      ]

      for (const input of invalidInputs) {
        const result = dataSourceSchemas.issueQuery.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })

  describe("API Options マッピング関数", () => {
    test("mapToGitHubApiOptions", () => {
      const input = { page: 2, perPage: 50 }
      const result = mapToGitHubApiOptions(input)
      expect(result).toEqual({ page: 2, perPage: 50 })
    })

    test("mapToGitHubPullRequestOptions", () => {
      const input = {
        page: 3,
        perPage: 25,
        state: "closed" as const,
        sort: "updated" as const,
        direction: "asc" as const,
      }
      const result = mapToGitHubPullRequestOptions(input)
      expect(result).toEqual({
        page: 3,
        perPage: 25,
        state: "closed",
        sort: "updated",
        direction: "asc",
      })
    })

    test("mapToGitHubIssueOptions", () => {
      const input = {
        page: 1,
        perPage: 10,
        state: "all" as const,
        sort: "comments" as const,
        direction: "desc" as const,
        since: "2023-01-01T00:00:00Z",
      }
      const result = mapToGitHubIssueOptions(input)
      expect(result).toEqual({
        page: 1,
        perPage: 10,
        state: "all",
        sort: "comments",
        direction: "desc",
        since: "2023-01-01T00:00:00Z",
      })
    })
  })

  describe("レスポンススキーマ", () => {
    test("apiResponse スキーマが正しい構造を受け入れる", () => {
      const mockDataSchema = dataSourceSchemas.usernameParams
      const responseSchema = dataSourceSchemas.apiResponse(mockDataSchema)

      const validResponse = {
        success: true,
        data: { username: "testuser" },
        meta: {
          page: 1,
          perPage: 30,
          total: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      const result = responseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    test("errorResponse スキーマが正しい構造を受け入れる", () => {
      const validError = {
        success: false,
        error: {
          code: "GITHUB_API_ERROR",
          message: "APIエラーが発生しました",
          details: { status: 404 },
        },
      }

      const result = dataSourceSchemas.errorResponse.safeParse(validError)
      expect(result.success).toBe(true)
    })
  })
})
