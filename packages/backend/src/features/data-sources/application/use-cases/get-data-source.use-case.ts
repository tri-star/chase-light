import type {
  DataSourceRepository,
  UserAccountRepository,
} from "../../domain/repositories"
import { UserNotFoundError, DataSourceNotFoundError } from "../../errors"
import type { DataSourceListItem } from "../../domain"

export type GetDataSourceInput = {
  dataSourceId: string
  userId: string
}

export type GetDataSourceOutput = DataSourceListItem

export class GetDataSourceUseCase {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly userAccountRepository: UserAccountRepository,
  ) {}

  async execute(input: GetDataSourceInput): Promise<GetDataSourceOutput> {
    const user = await this.userAccountRepository.findByAuth0Id(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    const dataSource = await this.dataSourceRepository.findByIdWithUserAccess(
      input.dataSourceId,
      user.id,
    )

    if (!dataSource) {
      throw new DataSourceNotFoundError(input.dataSourceId)
    }

    return dataSource
  }
}
