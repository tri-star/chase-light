import { EventRepository } from "../repositories/event.repository"
import { TranslationService } from "./translation.service"
import { EVENT_STATUS, type Event } from "../domain/event"

interface ProcessUpdatesInputDto {
  eventIds: string[]
}

interface ProcessUpdatesOutputDto {
  processedEventIds: string[]
  failedEventIds: string[]
}

interface ProcessEventResult {
  eventId: string
  success: boolean
  error?: string
}

/**
 * 検知されたイベントのAI翻訳・状態更新を行うサービス
 */
export class ProcessUpdatesService {
  constructor(
    private eventRepository: EventRepository,
    private translationService: TranslationService,
  ) {}

  /**
   * 複数イベントの一括処理
   */
  async execute(
    input: ProcessUpdatesInputDto,
  ): Promise<ProcessUpdatesOutputDto> {
    const { eventIds } = input

    if (eventIds.length === 0) {
      return { processedEventIds: [], failedEventIds: [] }
    }

    // イベントデータの取得
    const events = await this.eventRepository.findByIds(eventIds)

    if (events.length === 0) {
      return { processedEventIds: [], failedEventIds: eventIds }
    }

    // 各イベントを個別に処理
    const results = await Promise.allSettled(
      events.map((event) => this.processEvent(event)),
    )

    // 結果を集計
    const processedEventIds: string[] = []
    const failedEventIds: string[] = []

    results.forEach((result, index) => {
      const eventId = events[index].id

      if (result.status === "fulfilled" && result.value.success) {
        processedEventIds.push(eventId)
      } else {
        failedEventIds.push(eventId)
      }
    })

    return { processedEventIds, failedEventIds }
  }

  /**
   * 単一イベントの処理
   */
  private async processEvent(event: Event): Promise<ProcessEventResult> {
    try {
      // 既に処理済みのイベントはスキップ
      if (event.status === EVENT_STATUS.COMPLETED) {
        return { eventId: event.id, success: true }
      }

      // AI翻訳を実行
      const translationResult = await this.translationService.translate(
        event.eventType,
        event.title,
        event.body,
      )

      // 翻訳結果でイベントを更新
      const updateSuccess = await this.eventRepository.updateWithTranslation(
        event.id,
        translationResult.translatedTitle,
        translationResult.translatedBody,
        EVENT_STATUS.COMPLETED,
        null,
      )

      if (!updateSuccess) {
        throw new Error("Failed to update event with translation result")
      }

      return { eventId: event.id, success: true }
    } catch (error) {
      // エラー時はステータスをFAILEDに更新
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      await this.eventRepository
        .updateStatus(event.id, EVENT_STATUS.FAILED, errorMessage)
        .catch(() => {
          // ステータス更新に失敗してもログに記録するだけで処理は継続
          console.error(
            `Failed to update status for event ${event.id}:`,
            errorMessage,
          )
        })

      return {
        eventId: event.id,
        success: false,
        error: errorMessage,
      }
    }
  }
}
