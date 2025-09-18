import { uuidv7 } from "uuidv7"
import { ACTIVITY_TYPE } from "../../domain/activity"
import {
  DETECTION_DEFAULTS,
  DETECTION_ERRORS,
} from "../../constants/detection.constants"
import { GitHubActivityGateway } from "../ports/github-activity.gateway"
import {
  DetectTargetId,
  isGitHubDataSource,
  toDetectTargetId,
} from "../../domain/detect-target"
import { DetectTargetRepository } from "../../domain/repositories/detect-target.repository"
import { ActivityRepository } from "../../domain/repositories/activity.repository"

/**
 * データソースの更新を検知するサービス
 */
export class DetectUpdateUseCase {
  constructor(
    private detectTargetRepository: DetectTargetRepository,
    private activityRepository: ActivityRepository,
    private githubActivityGateway: GitHubActivityGateway,
  ) {}

  /**
   * 指定されたデータソースの更新を検知し、新規イベントを保存する
   */
  async detectUpdates(rawDetectTargetId: DetectTargetId): Promise<string[]> {
    const detectTargetId = toDetectTargetId(rawDetectTargetId)

    // 1. データソース情報の取得（repository内包）
    const detectTarget =
      await this.detectTargetRepository.findById(detectTargetId)
    if (!detectTarget) {
      throw new Error(DETECTION_ERRORS.DATA_SOURCE_NOT_FOUND)
    }

    // 2. GitHubDataSourceかどうかチェック
    if (!isGitHubDataSource(detectTarget)) {
      throw new Error("Unsupported data source type")
    }

    const githubDetectTarget = detectTarget
    const repository = githubDetectTarget.repository

    // 3. 前回実行時刻の取得
    const lastCheckTime =
      await this.activityRepository.getLastCheckTimeForDataSource(
        detectTargetId,
      )
    const sinceDate = lastCheckTime || this.getDefaultSinceDate()

    // 4. GitHub APIで更新を取得
    const [owner, repo] = repository.fullName.split("/")
    const allActivityIds: string[] = []

    // 並列実行し、どれか一つでもエラーがあればthrowする
    const results = await Promise.allSettled([
      this.fetchAndSaveReleases(owner, repo, detectTargetId, sinceDate),
      this.fetchAndSaveIssues(owner, repo, detectTargetId, sinceDate),
      this.fetchAndSavePullRequests(owner, repo, detectTargetId, sinceDate),
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
    allActivityIds.push(...releaseIds, ...issueIds, ...prIds)
    return allActivityIds
  }

  /**
   * リリースを取得して保存
   */
  private async fetchAndSaveReleases(
    owner: string,
    repo: string,
    detectTargetId: DetectTargetId,
    sinceDate: Date,
  ): Promise<string[]> {
    const releases = await this.githubActivityGateway.getReleases(owner, repo, {
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
    const activitiesToSave = newReleases.map((release) => ({
      id: uuidv7(),
      detectTargetId,
      githubEventId: release.id.toString(),
      activityType: ACTIVITY_TYPE.RELEASE,
      title: release.name || release.tag_name,
      body: release.body || "",
      version: release.tag_name,
      githubData: JSON.stringify(release),
      createdAt: release.published_at
        ? new Date(release.published_at)
        : new Date(release.created_at),
    }))

    const result = await this.activityRepository.upsertMany(activitiesToSave)
    return result.newActivityIds
  }

  /**
   * Issueを取得して保存
   */
  private async fetchAndSaveIssues(
    owner: string,
    repo: string,
    detectTargetId: DetectTargetId,
    sinceDate: Date,
  ): Promise<string[]> {
    const issues = await this.githubActivityGateway.getIssues(owner, repo, {
      state: "all",
      since: sinceDate.toISOString(),
      perPage: DETECTION_DEFAULTS.PAGE_SIZE,
    })

    // イベントとして保存
    const activitiesToSave = issues.map((issue) => ({
      id: uuidv7(),
      detectTargetId,
      githubEventId: issue.id.toString(),
      activityType: ACTIVITY_TYPE.ISSUE,
      title: issue.title,
      body: issue.body || "",
      version: null,
      githubData: JSON.stringify(issue),
      createdAt: new Date(issue.created_at),
    }))

    const result = await this.activityRepository.upsertMany(activitiesToSave)
    return result.newActivityIds
  }

  /**
   * Pull Requestを取得して保存
   */
  private async fetchAndSavePullRequests(
    owner: string,
    repo: string,
    detectTargetId: DetectTargetId,
    sinceDate: Date,
  ): Promise<string[]> {
    const pullRequests = await this.githubActivityGateway.getPullRequests(
      owner,
      repo,
      {
        state: "all",
        since: sinceDate.toISOString(),
        perPage: DETECTION_DEFAULTS.PAGE_SIZE,
      },
    )

    // イベントとして保存
    const activitiesToSave = pullRequests.map((pr) => ({
      id: uuidv7(),
      detectTargetId,
      githubEventId: pr.id.toString(),
      activityType: ACTIVITY_TYPE.PULL_REQUEST,
      title: pr.title,
      body: pr.body || "",
      version: null,
      githubData: JSON.stringify(pr),
      createdAt: new Date(pr.created_at),
    }))

    const result = await this.activityRepository.upsertMany(activitiesToSave)
    return result.newActivityIds
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
