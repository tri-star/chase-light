import { uuidv7 } from "uuidv7"
import { DataSourceRepository } from "../../data-sources/repositories"
import type { GitHubApiServiceInterface } from "../../data-sources/services/interfaces/github-api-service.interface"
import { isGitHubDataSource } from "../../data-sources/domain"
import { EventRepository } from "../repositories"
import { EVENT_TYPE } from "../domain/detection-types"
import {
  DETECTION_DEFAULTS,
  DETECTION_ERRORS,
} from "../constants/detection.constants"

/**
 * データソースの更新を検知するサービス
 */
export class DataSourceUpdateDetectorService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private eventRepository: EventRepository,
    private githubApiService: GitHubApiServiceInterface,
  ) {}

  /**
   * 指定されたデータソースの更新を検知し、新規イベントを保存する
   */
  async detectUpdates(dataSourceId: string): Promise<string[]> {
    // 1. データソース情報の取得（repository内包）
    const dataSource = await this.dataSourceRepository.findById(dataSourceId)
    if (!dataSource) {
      throw new Error(DETECTION_ERRORS.DATA_SOURCE_NOT_FOUND)
    }

    // 2. GitHubDataSourceかどうかチェック
    if (!isGitHubDataSource(dataSource)) {
      throw new Error("Unsupported data source type")
    }

    const githubDataSource = dataSource
    const repository = githubDataSource.repository

    // 3. 前回実行時刻の取得
    const lastCheckTime =
      await this.eventRepository.getLastCheckTimeForDataSource(dataSourceId)
    const sinceDate = lastCheckTime || this.getDefaultSinceDate()

    // 4. GitHub APIで更新を取得
    const [owner, repo] = repository.fullName.split("/")
    const allNewEventIds: string[] = []

    // 並列実行し、どれか一つでもエラーがあればthrowする
    const results = await Promise.allSettled([
      this.fetchAndSaveReleases(owner, repo, dataSourceId, sinceDate),
      this.fetchAndSaveIssues(owner, repo, dataSourceId, sinceDate),
      this.fetchAndSavePullRequests(owner, repo, dataSourceId, sinceDate),
    ])

    // どれか一つでもエラーがあれば最初のエラーをthrow
    const firstRejected = results.find((r) => r.status === "rejected") as
      | PromiseRejectedResult
      | undefined
    if (firstRejected) {
      const error = firstRejected.reason
      if (error instanceof Error) {
        throw new Error(
          `${DETECTION_ERRORS.GITHUB_API_ERROR}: ${error.message}`,
        )
      }
      throw error
    }

    // 全てfulfilledの場合のみIDをまとめて返す
    const [releaseIds, issueIds, prIds] = results.map((r) =>
      r.status === "fulfilled" ? r.value : [],
    )
    allNewEventIds.push(...releaseIds, ...issueIds, ...prIds)
    return allNewEventIds
  }

  /**
   * リリースを取得して保存
   */
  private async fetchAndSaveReleases(
    owner: string,
    repo: string,
    dataSourceId: string,
    sinceDate: Date,
  ): Promise<string[]> {
    const releases = await this.githubApiService.getReleases(owner, repo, {
      perPage: DETECTION_DEFAULTS.PAGE_SIZE,
    })

    // 日付でフィルタリング
    const newReleases = releases.filter((release) => {
      const publishedAt = release.published_at
        ? new Date(release.published_at)
        : new Date(release.created_at)
      return publishedAt > sinceDate
    })

    // イベントとして保存
    const eventsToSave = newReleases.map((release) => ({
      id: uuidv7(),
      dataSourceId,
      githubEventId: release.id.toString(),
      eventType: EVENT_TYPE.RELEASE,
      title: release.name || release.tag_name,
      body: release.body || "",
      version: release.tag_name,
      githubData: JSON.stringify(release),
      createdAt: release.published_at
        ? new Date(release.published_at)
        : new Date(release.created_at),
    }))

    const result = await this.eventRepository.upsertMany(eventsToSave)
    return result.newEventIds
  }

  /**
   * Issueを取得して保存
   */
  private async fetchAndSaveIssues(
    owner: string,
    repo: string,
    dataSourceId: string,
    sinceDate: Date,
  ): Promise<string[]> {
    const issues = await this.githubApiService.getIssues(owner, repo, {
      state: "all",
      since: sinceDate.toISOString(),
      perPage: DETECTION_DEFAULTS.PAGE_SIZE,
    })

    // イベントとして保存
    const eventsToSave = issues.map((issue) => ({
      id: uuidv7(),
      dataSourceId,
      githubEventId: issue.id.toString(),
      eventType: EVENT_TYPE.ISSUE,
      title: issue.title,
      body: issue.body || "",
      version: null,
      githubData: JSON.stringify(issue),
      createdAt: new Date(issue.created_at),
    }))

    const result = await this.eventRepository.upsertMany(eventsToSave)
    return result.newEventIds
  }

  /**
   * Pull Requestを取得して保存
   */
  private async fetchAndSavePullRequests(
    owner: string,
    repo: string,
    dataSourceId: string,
    sinceDate: Date,
  ): Promise<string[]> {
    const pullRequests = await this.githubApiService.getPullRequests(
      owner,
      repo,
      {
        state: "all",
        since: sinceDate.toISOString(),
        perPage: DETECTION_DEFAULTS.PAGE_SIZE,
      },
    )

    // イベントとして保存
    const eventsToSave = pullRequests.map((pr) => ({
      id: uuidv7(),
      dataSourceId,
      githubEventId: pr.id.toString(),
      eventType: EVENT_TYPE.PULL_REQUEST,
      title: pr.title,
      body: pr.body || "",
      version: null,
      githubData: JSON.stringify(pr),
      createdAt: new Date(pr.created_at),
    }))

    const result = await this.eventRepository.upsertMany(eventsToSave)
    return result.newEventIds
  }

  /**
   * デフォルトのsince日付を取得（7日前）
   */
  private getDefaultSinceDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() - DETECTION_DEFAULTS.INITIAL_LOOKBACK_DAYS)
    return date
  }
}
