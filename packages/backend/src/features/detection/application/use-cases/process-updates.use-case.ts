import { TranslationPort } from "../../application/ports/translation.port"
import { SummarizationPort } from "../../application/ports/summarization.port"
import { ACTIVITY_STATUS, type Activity } from "../../domain/activity"
import { ActivityRepository } from "../../domain/repositories/activity.repository"

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
 * 検知されたイベントのAI翻訳・要約・状態更新を行うサービス
 */
export class ProcessUpdatesUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private translationPort: TranslationPort | null,
    private summarizationPort: SummarizationPort | null,
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

    // 既に処理済み(COMPLETED)のイベントは完全にスキップし、
    // 成功/失敗いずれにもカウントしない
    const targets = activities.filter(
      (a) => a.status !== ACTIVITY_STATUS.COMPLETED,
    )

    if (targets.length === 0) {
      return { processedActivityIds: [], failedActivityIds: [] }
    }

    // 各イベントを個別に処理
    const results = await Promise.allSettled<ProcessactivityResult>(
      targets.map((activity: Activity) => this.processactivity(activity)),
    )

    // 結果を集計
    const processedActivityIds: string[] = []
    const failedActivityIds: string[] = []

    results.forEach(
      (result: PromiseSettledResult<ProcessactivityResult>, index: number) => {
        const activityId = targets[index].id

        if (result.status === "fulfilled" && result.value.success) {
          processedActivityIds.push(activityId)
        } else {
          failedActivityIds.push(activityId)
        }
      },
    )

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

      let translatedTitle: string | null = null
      let summary: string | null = null

      // OpenAI APIが利用可能な場合のみ翻訳・要約を実行
      if (this.translationPort && this.summarizationPort) {
        // AI翻訳を実行
        const translationResult = await this.translationPort.translate(
          activity.activityType,
          activity.title,
          activity.body,
        )
        translatedTitle = translationResult.translatedTitle

        // AI要約を実行
        const summarizationResult = await this.summarizationPort.summarize(
          activity.activityType,
          activity.title,
          activity.body,
        )
        summary = summarizationResult.summary
      } else {
        // OpenAI APIが利用不可の場合は警告ログを出力
        console.warn(
          `OpenAI API not available. Skipping translation and summarization for activity ${activity.id}`,
        )
      }

      // 翻訳・要約結果でイベントを更新（原文は保持）
      const updateSuccess =
        await this.activityRepository.updateTranslationAndSummary(
          activity.id,
          translatedTitle,
          summary,
          ACTIVITY_STATUS.COMPLETED,
          null,
        )

      if (!updateSuccess) {
        throw new Error(
          "Failed to update activity with translation and summary",
        )
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
        .catch((updateError: unknown) => {
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
