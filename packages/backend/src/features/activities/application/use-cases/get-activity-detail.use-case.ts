/**
 * アクティビティ詳細取得ユースケース
 */

import type { ActivityRepository } from "../../domain/repositories/activity.repository"
import type { ActivityId, ActivityDetail } from "../../domain/activity"

/**
 * ユースケース入力
 */
export type GetActivityDetailInput = {
  activityId: ActivityId
  userId: string
}

/**
 * ユースケース出力
 */
export type GetActivityDetailOutput = ActivityDetail

/**
 * アクティビティ詳細取得ユースケース
 */
export class GetActivityDetailUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(
    input: GetActivityDetailInput,
  ): Promise<GetActivityDetailOutput | null> {
    // アクティビティ詳細の取得（権限チェックはリポジトリ層で実施）
    const activity = await this.activityRepository.findById(
      input.activityId,
      input.userId,
    )

    // アクティビティが存在しない、または権限がない場合はnullを返す
    return activity
  }
}
