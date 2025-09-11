import type { GitHubDataSource, UserWatch } from "../domain";
import type { UserWatchRepository } from "../repositories";
import type { UserRepository } from "../../user/repositories/user.repository";
import { UserNotFoundError } from "../errors";
import { DataSourceCreationService } from "./data-source-creation.service";
import { TransactionManager } from "../../../core/db";

/**
 * データソースウォッチサービスの入力DTO
 */
export type CreateDataSourceWatchInputDto = {
  repositoryUrl: string;
  userId: string;
  name?: string;
  description?: string;
  notificationEnabled?: boolean;
  watchReleases?: boolean;
  watchIssues?: boolean;
  watchPullRequests?: boolean;
};

/**
 * データソースウォッチサービスの出力DTO
 * GitHubDataSourceにはrepository情報が内包されている
 */
export type CreateDataSourceWatchOutputDto = {
  dataSource: GitHubDataSource;
  userWatch: UserWatch;
};

/**
 * データソースウォッチサービス
 * GitHub リポジトリをデータソースとして登録し、ユーザーのウォッチ設定を作成
 */
export class DataSourceWatchService {
  constructor(
    private dataSourceCreationService: DataSourceCreationService,
    private userWatchRepository: UserWatchRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * GitHub リポジトリをデータソースとして登録し、ユーザーウォッチ設定を作成
   */
  async execute(
    input: CreateDataSourceWatchInputDto,
  ): Promise<CreateDataSourceWatchOutputDto> {
    return await TransactionManager.transaction(async () => {
      // DataSourceCreationServiceを使用してGitHubDataSource（repository内包）を作成/取得
      const { dataSource } = await this.dataSourceCreationService.execute({
        repositoryUrl: input.repositoryUrl,
        name: input.name,
        description: input.description,
      });

      // Auth0 UserIDからユーザーのDBレコードを取得
      const user = await this.userRepository.findByAuth0Id(input.userId);
      if (!user) {
        throw new UserNotFoundError(input.userId);
      }

      // 既存のユーザーウォッチをチェック
      const existingUserWatch =
        await this.userWatchRepository.findByUserAndDataSource(
          user.id,
          dataSource.id,
        );

      if (existingUserWatch) {
        // 既存のウォッチ設定を更新
        const updatedUserWatch =
          await this.userWatchRepository.updateByUserAndDataSource(
            user.id,
            dataSource.id,
            {
              notificationEnabled: input.notificationEnabled,
              watchReleases: input.watchReleases,
              watchIssues: input.watchIssues,
              watchPullRequests: input.watchPullRequests,
            },
          );

        if (!updatedUserWatch) {
          throw new Error(
            `Failed to update UserWatch for userId: ${user.id} and dataSourceId: ${dataSource.id}`,
          );
        }

        return {
          dataSource,
          userWatch: updatedUserWatch,
        };
      }

      // 新規ユーザーウォッチ作成
      const userWatch = await this.userWatchRepository.save({
        userId: user.id,
        dataSourceId: dataSource.id,
        notificationEnabled: input.notificationEnabled ?? true,
        watchReleases: input.watchReleases ?? true,
        watchIssues: input.watchIssues ?? false,
        watchPullRequests: input.watchPullRequests ?? false,
      });

      return {
        dataSource,
        userWatch,
      };
    });
  }
}
