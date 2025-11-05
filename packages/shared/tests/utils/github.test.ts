import { describe, expect, test } from "vitest";
import {
  isGitHubRepositoryUrl,
  parseGitHubRepositoryUrl,
} from "../../src/utils/github";

describe("parseGitHubRepositoryUrl", () => {
  test("標準的なGitHubリポジトリURLをパースできる", () => {
    const result = parseGitHubRepositoryUrl("https://github.com/foo/bar");
    expect(result).toEqual({ owner: "foo", repo: "bar" });
  });

  test("末尾にスラッシュがあるURLをパースできる", () => {
    const result = parseGitHubRepositoryUrl("https://github.com/foo/bar/");
    expect(result).toEqual({ owner: "foo", repo: "bar" });
  });

  test(".gitサフィックス付きURLをパースできる", () => {
    const result = parseGitHubRepositoryUrl("https://github.com/foo/bar.git");
    expect(result).toEqual({ owner: "foo", repo: "bar" });
  });

  test("https以外のURLはnullを返す", () => {
    expect(parseGitHubRepositoryUrl("http://github.com/foo/bar")).toBeNull();
  });

  test("github以外のドメインはnullを返す", () => {
    expect(parseGitHubRepositoryUrl("https://gitlab.com/foo/bar")).toBeNull();
  });

  test("リポジトリセグメントが不足している場合はnullを返す", () => {
    expect(parseGitHubRepositoryUrl("https://github.com/foo")).toBeNull();
  });

  test("余分なパスセグメントがある場合はnullを返す", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/foo/bar/issues"),
    ).toBeNull();
  });

  test("クエリパラメータがある場合はnullを返す", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/foo/bar?tab=readme"),
    ).toBeNull();
  });
});

describe("isGitHubRepositoryUrl", () => {
  test("有効なGitHubリポジトリURLの場合trueを返す", () => {
    expect(isGitHubRepositoryUrl("https://github.com/foo/bar")).toBe(true);
  });

  test("無効なGitHubリポジトリURLの場合falseを返す", () => {
    expect(isGitHubRepositoryUrl("https://example.com/foo/bar")).toBe(false);
  });
});
