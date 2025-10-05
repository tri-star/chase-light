/**
 * ユーザーのアクティビティ一覧取得ユースケース
 */

import type {
  ActivityRepository,
  ActivityFilterInput,
  PaginationInput,
  SortInput,
} from "../../domain/repositories/activity.repository"
import type { ActivityWithDataSource } from "../../domain/activity"

/**
 * ユースケース入力
 */
export type ListUserActivitiesInput = {
  userId: string
  filter?: ActivityFilterInput
  pagination?: Partial<PaginationInput>
  sort?: Partial<SortInput>
}

/**
 * ページネーション情報
 */
export type PaginationInfo = {
  currentPage: number
  perPage: number
  totalItems: number
  totalPages: number
}

/**
 * ユースケース出力
 */
export type ListUserActivitiesOutput = {
  items: ActivityWithDataSource[]
  pagination: PaginationInfo
}

/**
 * デフォルト値
 */
const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100
const DEFAULT_SORT_BY = "createdAt"
const DEFAULT_SORT_ORDER = "desc"

/**
 * ユーザーのアクティビティ一覧取得ユースケース
 */
export class ListUserActivitiesUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(
    input: ListUserActivitiesInput,
  ): Promise<ListUserActivitiesOutput> {
    // ページネーションパラメータの正規化
    const page = input.pagination?.page ?? DEFAULT_PAGE
    const perPage = Math.min(
      input.pagination?.perPage ?? DEFAULT_PER_PAGE,
      MAX_PER_PAGE,
    )

    // ソートパラメータの正規化
    const sortBy = input.sort?.sortBy ?? DEFAULT_SORT_BY
    const sortOrder = input.sort?.sortOrder ?? DEFAULT_SORT_ORDER

    // 総件数の取得
    const totalItems = await this.activityRepository.countByUserId(
      input.userId,
      input.filter,
    )

    // 総ページ数の計算
    const totalPages = Math.ceil(totalItems / perPage)

    // アクティビティ一覧の取得
    const items = await this.activityRepository.findByUserId({
      userId: input.userId,
      filter: input.filter,
      pagination: { page, perPage },
      sort: { sortBy, sortOrder },
    })

    return {
      items,
      pagination: {
        currentPage: page,
        perPage,
        totalItems,
        totalPages,
      },
    }
  }
}
