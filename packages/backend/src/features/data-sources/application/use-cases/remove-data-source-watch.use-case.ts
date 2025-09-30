import { TransactionManager } from "../../../../core/db"
import type {
  DataSourceRepository,
  UserAccountRepository,
} from "../../domain/repositories"
import { DataSourceNotFoundError, UserNotFoundError } from "../../errors"

export type RemoveDataSourceWatchInput = {
  dataSourceId: string
  userId: string
}

export type RemoveDataSourceWatchOutput = {
  success: boolean
}

export class RemoveDataSourceWatchUseCase {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly userAccountRepository: UserAccountRepository,
  ) {}

  async execute(
    input: RemoveDataSourceWatchInput,
  ): Promise<RemoveDataSourceWatchOutput> {
    return await TransactionManager.transaction(async () => {
      const user = await this.userAccountRepository.findByAuth0Id(input.userId)
      if (!user) {
        throw new UserNotFoundError(input.userId)
      }

      const success =
        await this.dataSourceRepository.removeUserWatchAndRelatedData(
          input.dataSourceId,
          user.id,
        )

      if (!success) {
        throw new DataSourceNotFoundError(input.dataSourceId)
      }

      return {
        success: true,
      }
    })
  }
}
