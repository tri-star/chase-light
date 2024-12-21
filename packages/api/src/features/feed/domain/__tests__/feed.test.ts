import { describe, expect, test } from "vitest"
import { isSupportedDataSource } from "../feed"

describe("isSupportedDataSource", () => {
  test("サポートされているGitHub URLの場合はtrueを返すこと", () => {
    const url = "https://github.com/owner/repo"
    expect(isSupportedDataSource(url)).toBe(true)
  })

  test("スキームがhttpの場合falseを返すこと", () => {
    const url = "http://github.com/owner/repo"
    expect(isSupportedDataSource(url)).toBe(false)
  })

  test("サポートされていないURLの場合はfalseを返すこと", () => {
    const url = "https://example.com/owner/repo"
    expect(isSupportedDataSource(url)).toBe(false)
  })

  test("無効なURLの場合はfalseを返すこと", () => {
    const url = "invalid-url"
    expect(isSupportedDataSource(url)).toBe(false)
  })
})
