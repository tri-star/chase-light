import type { DataSourceListFilters, DataSourceListResult } from "../domain"
import type { DataSourceRepository } from "../repositories"
import type { UserRepository } from "../../user/repositories/user.repository"
import { UserNotFoundError } from "../errors"

/**
 * データソース一覧取得サービスの入力DTO
 */
export type DataSourceListInputDto = {
  userId: string
  filters?: DataSourceListFilters
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

/**
 * データソース一覧取得サービスの出力DTO
 */
export type DataSourceListOutputDto = {
  items: DataSourceListResult["items"]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * データソース一覧取得サービス
 * ユーザーがWatch中のデータソースを取得し、ページネーション情報を付与
 */
export class DataSourceListService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * データソース一覧を取得
   */
  async execute(input: DataSourceListInputDto): Promise<DataSourceListOutputDto> {
    // Auth0 UserIDからユーザーのDBレコードを取得
    const user = await this.userRepository.findByAuth0Id(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    // ページネーション計算
    const page = input.page || 1
    const perPage = Math.min(input.perPage || 20, 100) // 最大100件
    const offset = (page - 1) * perPage

    // フィルター条件を準備
    const filters: DataSourceListFilters = {
      ...input.filters,
      offset,
      limit: perPage,
      sortBy: (input.sortBy as DataSourceListFilters["sortBy"]) || "createdAt",
      sortOrder: input.sortOrder || "desc",
    }

    // データソース一覧を取得
    const result = await this.dataSourceRepository.findByUserWithFilters(
      user.id,
      filters,
    )

    // ページネーション情報を計算
    const totalPages = Math.ceil(result.total / perPage)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      items: result.items,
      pagination: {
        page,
        perPage,
        total: result.total,
        totalPages,
        hasNext,
        hasPrev,
      },
    }
  }
}