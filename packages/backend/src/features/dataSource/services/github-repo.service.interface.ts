import type { Repository } from "../schemas/repository.schema"
import type { Release } from "../schemas/release.schema"
import type { PullRequest } from "../schemas/pull-request.schema"
import type { Issue } from "../schemas/issue.schema"

/**
 * GitHub Repository Service Interface
 *
 * GitHubリポジトリとの連携を行うサービスのインターフェース
 * 本番実装とテスト用スタブの両方で実装される
 */
export interface IGitHubRepoService {
  /**
   * 認証ユーザーがwatch済みのリポジトリ一覧を取得
   * @returns Repository配列
   */
  getWatchedRepositories(): Promise<Repository[]>

  /**
   * 指定リポジトリの詳細情報を取得
   * @param owner リポジトリオーナー名
   * @param repo リポジトリ名
   * @returns Repository詳細情報
   */
  getRepositoryDetails(owner: string, repo: string): Promise<Repository>

  /**
   * 指定リポジトリのリリース一覧を取得
   * @param owner リポジトリオーナー名
   * @param repo リポジトリ名
   * @param options ページング等のオプション
   * @returns Release配列
   */
  getRepositoryReleases(
    owner: string,
    repo: string,
    options?: { page?: number; perPage?: number },
  ): Promise<Release[]>

  /**
   * 指定リポジトリのPull Request一覧を取得
   * @param owner リポジトリオーナー名
   * @param repo リポジトリ名
   * @param options ページング等のオプション
   * @returns PullRequest配列
   */
  getRepositoryPullRequests(
    owner: string,
    repo: string,
    options?: {
      page?: number
      perPage?: number
      state?: "open" | "closed" | "all"
    },
  ): Promise<PullRequest[]>

  /**
   * 指定リポジトリのIssue一覧を取得
   * @param owner リポジトリオーナー名
   * @param repo リポジトリ名
   * @param options ページング等のオプション
   * @returns Issue配列
   */
  getRepositoryIssues(
    owner: string,
    repo: string,
    options?: {
      page?: number
      perPage?: number
      state?: "open" | "closed" | "all"
    },
  ): Promise<Issue[]>
}
