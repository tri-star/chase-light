import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DataSourceRepository } from "../../../data-sources/repositories/data-source.repository"
import { DrizzleActivityRepository } from "../../infra/repositories"
import { DetectUpdateUseCase } from "../../application/use-cases"
import type {
  DetectUpdatesInput,
  DetectUpdatesOutput,
} from "../../domain/detection-types"
import { DETECTION_ERRORS } from "../../constants/detection.constants"
import { createGitHubActivityGateway } from "../../infra/adapters/github-activity/github-activity-gateway.factory"

/**
 * detect-datasource-updates Lambda関数のハンドラー
 * 指定されたデータソースの更新（Issue/PR/Release）を検知し、
 * 新規イベントとしてDBに保存する
 */
export const handler = async (
  event: DetectUpdatesInput,
  context: Context,
): Promise<DetectUpdatesOutput> => {
  console.log("activity:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  // 入力検証
  if (!event.dataSourceId) {
    console.error("Missing required parameter: dataSourceId")
    throw new Error(DETECTION_ERRORS.INVALID_INPUT)
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // リポジトリとサービスのインスタンス化
      const dataSourceRepository = new DataSourceRepository()
      const activityRepository = new DrizzleActivityRepository()

      // GitHub APIサービス（現時点では認証なし - 認証を追加することでレート制限が緩和される可能性あり）
      // TODO: Implement authentication for GitHub API to increase rate limits and improve reliability.
      const githubApiService = createGitHubActivityGateway()

      // 更新検知サービス
      const updateDetectorService = new DetectUpdateUseCase(
        dataSourceRepository,
        activityRepository,
        githubApiService,
      )

      // 更新検知実行
      console.log(`Detecting updates for dataSource: ${event.dataSourceId}`)
      const activityIds = await updateDetectorService.detectUpdates(
        event.dataSourceId,
      )

      console.log(
        `Detection completed. Found ${activityIds.length} new activities`,
      )

      return {
        activityIds,
      }
    })
  } catch (error) {
    console.error("Error in detect-datasource-updates handler:", error)

    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // エラーを再スロー（StepFunctionsでエラーハンドリング）
    throw error
  }
}
