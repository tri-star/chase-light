import type { Context } from "aws-lambda"
import { connectDb } from "../../../../db/connection"
import { TransactionManager } from "../../../../core/db"
import { DrizzleActivityRepository } from "../../infra/repositories"
import { DetectUpdateUseCase } from "../../application/use-cases"
import { DETECTION_ERRORS } from "../../constants/detection.constants"
import { createGitHubActivityGateway } from "../../infra/adapters/github-activity/github-activity-gateway.factory"
import { DrizzleDetectTargetRepository } from "../../infra/repositories/drizzle-detect-target.repository"
import { toDetectTargetId } from "../../domain/detect-target"

/**
 * detect-datasource-updatesワーカーの入力型
 */
type DetectUpdatesInput = {
  /** 監視対象のデータソースID（UUID） */
  detectTargetId: string
}

/**
 * detect-datasource-updatesワーカーの出力型
 */
type DetectUpdatesOutput = {
  activityIds: string[]
}

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
  if (!event.detectTargetId) {
    console.error("Missing required parameter: detectTargetId")
    throw new Error(DETECTION_ERRORS.INVALID_INPUT)
  }

  try {
    // データベース接続を確立
    await connectDb()

    // トランザクション内で処理を実行
    return await TransactionManager.transaction(async () => {
      // リポジトリとサービスのインスタンス化
      const detectTargetRepository = new DrizzleDetectTargetRepository()
      const activityRepository = new DrizzleActivityRepository()

      // GitHub APIサービス（現時点では認証なし - 認証を追加することでレート制限が緩和される可能性あり）
      const githubApiService = createGitHubActivityGateway()

      // 更新検知サービス
      const detectUpdateUseCase = new DetectUpdateUseCase(
        detectTargetRepository,
        activityRepository,
        githubApiService,
      )

      // 更新検知実行
      console.log(`Detecting updates for detectTarget: ${event.detectTargetId}`)
      const activityIds = await detectUpdateUseCase.detectUpdates(
        toDetectTargetId(event.detectTargetId),
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
