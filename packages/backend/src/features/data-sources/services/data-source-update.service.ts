import type { GitHubDataSource, UserWatch } from "../domain"
import type { DataSourceRepository, UserWatchRepository } from "../repositories"
import type { UserRepository } from "../../user/repositories/user.repository"
import { DataSourceNotFoundError, UserNotFoundError } from "../errors"
import { TransactionManager } from "../../../core/db"

/**
 * データソース更新サービスの入力DTO
 */
export type UpdateDataSourceInputDto = {
  dataSourceId: string
  userId: string
  name?: string
  description?: string
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
}

/**
 * データソース更新サービスの出力DTO
 * GitHubDataSourceにはrepository情報が内包されている
 */
export type UpdateDataSourceOutputDto = {
  dataSource: GitHubDataSource
  userWatch: UserWatch
}

/**
 * データソース更新サービス
 * データソースの基本情報とユーザーウォッチ設定を更新
 */
export class DataSourceUpdateService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private userWatchRepository: UserWatchRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * データソースとユーザーウォッチを更新
   */
  async execute(
    input: UpdateDataSourceInputDto,
  ): Promise<UpdateDataSourceOutputDto> {
    return await TransactionManager.transaction(async () => {
      // Auth0 UserIDからユーザーのDBレコードを取得
      const user = await this.userRepository.findByAuth0Id(input.userId)
      if (!user) {
        throw new UserNotFoundError(input.userId)
      }

      // 権限チェック付きでデータソース詳細を取得
      const currentData =
        await this.dataSourceRepository.findByIdWithUserAccess(
          input.dataSourceId,
          user.id,
        )

      if (!currentData) {
        throw new DataSourceNotFoundError(input.dataSourceId)
      }

      // データソース基本情報の更新（name, descriptionが指定されている場合のみ）
      let updatedDataSource = currentData.dataSource
      if (input.name !== undefined || input.description !== undefined) {
        const updateResult =
          await this.dataSourceRepository.updateByIdWithUserAccess(
            input.dataSourceId,
            user.id,
            {
              name: input.name,
              description: input.description,
            },
          )

        if (updateResult) {
          updatedDataSource = updateResult
        }
      }

      // ユーザーウォッチ設定の更新（監視設定が指定されている場合のみ）
      let updatedUserWatch = currentData.userWatch
      if (
        input.notificationEnabled !== undefined ||
        input.watchReleases !== undefined ||
        input.watchIssues !== undefined ||
        input.watchPullRequests !== undefined
      ) {
        const watchUpdateResult =
          await this.userWatchRepository.updateByUserAndDataSource(
            user.id,
            input.dataSourceId,
            {
              notificationEnabled: input.notificationEnabled,
              watchReleases: input.watchReleases,
              watchIssues: input.watchIssues,
              watchPullRequests: input.watchPullRequests,
            },
          )

        if (watchUpdateResult) {
          updatedUserWatch = watchUpdateResult
        }
      }

      return {
        dataSource: updatedDataSource,
        userWatch: updatedUserWatch,
      }
    })
  }
}
