import type {
  DataSourceRepository,
  UserAccountRepository,
} from "../../domain/repositories"
import type { DataSourceListFilters, DataSourceListResult } from "../../domain"
import { UserNotFoundError } from "../../errors"

export type ListDataSourcesInput = {
  userId: string
  filters?: DataSourceListFilters
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export type ListDataSourcesOutput = {
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

export class ListDataSourcesUseCase {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly userAccountRepository: UserAccountRepository,
  ) {}

  async execute(input: ListDataSourcesInput): Promise<ListDataSourcesOutput> {
    const user = await this.userAccountRepository.findByAuth0Id(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    const page = input.page || 1
    const perPage = Math.min(input.perPage || 20, 100)
    const offset = (page - 1) * perPage

    const filters: DataSourceListFilters = {
      ...input.filters,
      offset,
      limit: perPage,
      sortBy: (input.sortBy as DataSourceListFilters["sortBy"]) || "createdAt",
      sortOrder: input.sortOrder || "desc",
    }

    const result = await this.dataSourceRepository.findByUserWithFilters(
      user.id,
      filters,
    )

    const totalPages = Math.ceil(result.total / perPage)

    return {
      items: result.items,
      pagination: {
        page,
        perPage,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }
}
