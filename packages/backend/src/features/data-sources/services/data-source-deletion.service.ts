import type { DataSourceRepository } from "../repositories"
import type { UserRepository } from "../../user/repositories/user.repository"
import { UserNotFoundError, DataSourceNotFoundError } from "../errors"
import { TransactionManager } from "../../../core/db"

/**
 * データソース削除サービスの入力DTO
 */
export type DeleteDataSourceInputDto = {
  dataSourceId: string
  userId: string
}

/**
 * データソース削除サービスの出力DTO
 */
export type DeleteDataSourceOutputDto = {
  success: boolean
}

/**
 * データソース削除サービス
 * ユーザーのデータソース監視を削除し、関連データも削除
 */
export class DataSourceDeletionService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * ユーザーのデータソース監視を削除
   */
  async execute(
    input: DeleteDataSourceInputDto,
  ): Promise<DeleteDataSourceOutputDto> {
    return await TransactionManager.transaction(async () => {
      // Auth0 UserIDからユーザーのDBレコードを取得
      const user = await this.userRepository.findByAuth0Id(input.userId)
      if (!user) {
        throw new UserNotFoundError(input.userId)
      }

      // ユーザーのウォッチ関連付けと関連データを削除
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
