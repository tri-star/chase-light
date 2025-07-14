import type { DataSourceListItem } from "../domain"
import type { DataSourceRepository } from "../repositories"
import type { UserRepository } from "../../user/repositories/user.repository"
import { UserNotFoundError, DataSourceNotFoundError } from "../errors"

/**
 * データソース詳細サービスの入力DTO
 */
export type DataSourceDetailInputDto = {
  dataSourceId: string
  userId: string
}

/**
 * データソース詳細サービスの出力DTO
 */
export type DataSourceDetailOutputDto = DataSourceListItem

/**
 * データソース詳細サービス
 * 認証ユーザーがWatch中のデータソースの詳細情報を取得
 */
export class DataSourceDetailService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * データソース詳細取得を実行
   */
  async execute(
    input: DataSourceDetailInputDto,
  ): Promise<DataSourceDetailOutputDto> {
    // ユーザーの存在確認
    const user = await this.userRepository.findByAuth0Id(input.userId)
    if (!user) {
      throw new UserNotFoundError(`ユーザーが見つかりません: ${input.userId}`)
    }

    // ユーザーがWatch中のデータソースを詳細情報付きで取得
    const dataSourceDetail =
      await this.dataSourceRepository.findByIdWithUserAccess(
        input.dataSourceId,
        user.id,
      )

    if (!dataSourceDetail) {
      throw new DataSourceNotFoundError(
        `データソースが見つかりません、またはアクセス権限がありません: ${input.dataSourceId}`,
      )
    }

    return dataSourceDetail
  }
}
