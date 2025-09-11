import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DataSourceRepository } from "../../../data-sources/repositories/data-source.repository"
import { createGitHubApiService } from "../../../data-sources/services/github-api-service.factory"
import { EventRepository } from "../../repositories"
import { DataSourceUpdateDetectorService } from "../../services"
import type {
  DetectUpdatesInput,
  DetectUpdatesOutput,
} from "../../domain/monitoring-types"
import { MONITORING_ERRORS } from "../../constants/monitoring.constants"

/**
 * detect-datasource-updates Lambda関数のハンドラー
 * 指定されたデータソースの更新（Issue/PR/Release）を検知し、
 * 新規イベントとしてDBに保存する
 */
export const handler = async (
  event: DetectUpdatesInput,
  context: Context,
): Promise<DetectUpdatesOutput> => {
  console.log("Event:", JSON.stringify(event, null, 2))
  console.log("Context:", context.awsRequestId)

  // 入力検証
  if (!event.dataSourceId) {
    console.error("Missing required parameter: dataSourceId")
    throw new Error(MONITORING_ERRORS.INVALID_INPUT)
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // リポジトリとサービスのインスタンス化
      const dataSourceRepository = new DataSourceRepository()
      const eventRepository = new EventRepository()

      // GitHub APIサービス（現時点では認証なし - 認証を追加することでレート制限が緩和される可能性あり）
      // TODO: Implement authentication for GitHub API to increase rate limits and improve reliability.
      const githubApiService = createGitHubApiService()

      // 更新検知サービス
      const updateDetectorService = new DataSourceUpdateDetectorService(
        dataSourceRepository,
        eventRepository,
        githubApiService,
      )

      // 更新検知実行
      console.log(`Detecting updates for dataSource: ${event.dataSourceId}`)
      const eventIds = await updateDetectorService.detectUpdates(
        event.dataSourceId,
      )

      console.log(`Detection completed. Found ${eventIds.length} new events`)

      return {
        eventIds,
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
