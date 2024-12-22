import { describe, expect, test } from "vitest"
import { isSupportedDataSource } from "../feed"

describe("isSupportedDataSource", () => {
  test.each([
    {
      description: "サポートされているGitHub URLの場合はtrueを返すこと",
      url: "https://github.com/owner/repo",
      expected: true,
    },
    {
      description: "スキームがhttpの場合falseを返すこと",
      url: "http://github.com/owner/repo",
      expected: false,
    },
    {
      description: "サポートされていないURLの場合はfalseを返すこと",
      url: "https://example.com/owner/repo",
      expected: false,
    },
    {
      description: "オーナー名が空文字の場合エラーになること",
      url: "https://github.com//repo",
      expected: false,
    },
    {
      description: "オーナー名がスペースの場合エラーになること",
      url: "https://github.com/ /repo",
      expected: false,
    },
    {
      description: "リポジトリ名が空文字の場合エラーになること",
      url: "https://github.com/owner/",
      expected: false,
    },
    {
      description: "リポジトリ名がスペースの場合エラーになること",
      url: "https://github.com/owner/ ",
      expected: false,
    },
    {
      description: "無効なURLの場合はfalseを返すこと",
      url: "invalid-url",
      expected: false,
    },
  ])("$description", ({ url, expected }) => {
    expect(isSupportedDataSource(url)).toBe(expected)
  })
})
