import { ActivityRepository } from "../repositories/event.repository"
import { TranslationService } from "./translation.service"
import { ACTIVITY_STATUS, type Activity } from "../domain/event"

interface ProcessUpdatesInputDto {
  activityIds: string[]
}

interface ProcessUpdatesOutputDto {
  processedActivityIds: string[]
  failedActivityIds: string[]
}

interface ProcessactivityResult {
  activityId: string
  success: boolean
  error?: string
}

/**
 * 検知されたイベントのAI翻訳・状態更新を行うサービス
 */
export class ProcessUpdatesService {
  constructor(
    private activityRepository: ActivityRepository,
    private translationService: TranslationService,
  ) {}

  /**
   * 複数イベントの一括処理
   */
  async execute(
    input: ProcessUpdatesInputDto,
  ): Promise<ProcessUpdatesOutputDto> {
    const { activityIds } = input

    if (activityIds.length === 0) {
      return { processedActivityIds: [], failedActivityIds: [] }
    }

    // イベントデータの取得
    const activities = await this.activityRepository.findByIds(activityIds)

    if (activities.length === 0) {
      return { processedActivityIds: [], failedActivityIds: activityIds }
    }

    // 各イベントを個別に処理
    const results = await Promise.allSettled(
      activities.map((activity) => this.processactivity(activity)),
    )

    // 結果を集計
    const processedActivityIds: string[] = []
    const failedActivityIds: string[] = []

    results.forEach((result, index) => {
      const activityId = activities[index].id

      if (result.status === "fulfilled" && result.value.success) {
        processedActivityIds.push(activityId)
      } else {
        failedActivityIds.push(activityId)
      }
    })

    return { processedActivityIds, failedActivityIds }
  }

  /**
   * 単一イベントの処理
   */
  private async processactivity(
    activity: Activity,
  ): Promise<ProcessactivityResult> {
    try {
      // 既に処理済みのイベントはスキップ
      if (activity.status === ACTIVITY_STATUS.COMPLETED) {
        return { activityId: activity.id, success: true }
      }

      // AI翻訳を実行
      const translationResult = await this.translationService.translate(
        activity.activityType,
        activity.title,
        activity.body,
      )

      // 翻訳結果でイベントを更新
      const updateSuccess = await this.activityRepository.updateWithTranslation(
        activity.id,
        translationResult.translatedTitle,
        translationResult.translatedBody,
        ACTIVITY_STATUS.COMPLETED,
        null,
      )

      if (!updateSuccess) {
        throw new Error("Failed to update activity with translation result")
      }

      return { activityId: activity.id, success: true }
    } catch (error) {
      // エラー時はステータスをFAILEDに更新
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      // 詳細なエラーログを出力
      console.error(`Failed to process activity ${activity.id}:`, {
        activityId: activity.id,
        activityType: activity.activityType,
        title: activity.title,
        errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })

      await this.activityRepository
        .updateStatus(activity.id, ACTIVITY_STATUS.FAILED, errorMessage)
        .catch((updateError) => {
          // ステータス更新に失敗してもログに記録するだけで処理は継続
          console.error(
            `Failed to update status for activity ${activity.id}:`,
            {
              activityId: activity.id,
              originalError: errorMessage,
              updateError:
                updateError instanceof Error
                  ? updateError.message
                  : updateError,
              updateErrorStack:
                updateError instanceof Error ? updateError.stack : undefined,
              timestamp: new Date().toISOString(),
            },
          )
        })

      return {
        activityId: activity.id,
        success: false,
        error: errorMessage,
      }
    }
  }
}
