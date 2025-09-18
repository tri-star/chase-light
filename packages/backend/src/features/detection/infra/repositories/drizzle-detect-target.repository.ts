import { eq } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { dataSources, repositories } from "../../../../db/schema"
import { DataSourceRepository } from "../../../data-sources/repositories"
import { DetectTarget, toDetectTargetId } from "../../domain/detect-target"
import {
  DetectTargetInputDto,
  DetectTargetOutputDto,
  DetectTargetRepository,
} from "../../domain/repositories/detect-target.repository"

export class DrizzleDetectTargetRepository implements DetectTargetRepository {
  // TODO: 別フェーズの作業で、外部featureに依存しないように修正する
  private dataSourceRepository: DataSourceRepository =
    new DataSourceRepository()

  constructor() {}

  async listDetectTargets(
    input: DetectTargetInputDto,
  ): Promise<DetectTargetOutputDto> {
    const detectTargets = await this.findMany({
      sourceType: input.sourceType,
    })

    return {
      detectTargets,
    }
  }

  /**
   * IDでデータソースを検索（repository情報を内包）
   */
  async findById(id: string): Promise<DetectTarget | null> {
    const connection = await TransactionManager.getConnection()
    const results = await connection
      .select({
        // データソース
        dataSourceId: dataSources.id,
        dataSourceType: dataSources.sourceType,
        dataSourceSourceId: dataSources.sourceId,
        dataSourceName: dataSources.name,
        dataSourceDescription: dataSources.description,
        dataSourceUrl: dataSources.url,
        dataSourceIsPrivate: dataSources.isPrivate,
        dataSourceCreatedAt: dataSources.createdAt,
        dataSourceUpdatedAt: dataSources.updatedAt,
        // リポジトリ
        repositoryId: repositories.id,
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .where(eq(dataSources.id, id))

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    if (row.dataSourceType === "github") {
      return {
        id: toDetectTargetId(row.dataSourceId),
        sourceType: "github" as const,
        sourceId: row.dataSourceSourceId,
        name: row.dataSourceName,
        description: row.dataSourceDescription,
        url: row.dataSourceUrl,
        isPrivate: row.dataSourceIsPrivate,
        createdAt: row.dataSourceCreatedAt,
        updatedAt: row.dataSourceUpdatedAt,
        repository: {
          id: row.repositoryId,
          githubId: row.repositoryGithubId,
          fullName: row.repositoryFullName,
          owner: row.repositoryFullName.split("/")[0] || "",
          language: row.repositoryLanguage,
          starsCount: row.repositoryStarsCount,
          forksCount: row.repositoryForksCount,
          openIssuesCount: row.repositoryOpenIssuesCount,
          isFork: row.repositoryIsFork,
          createdAt: row.repositoryCreatedAt!,
          updatedAt: row.repositoryUpdatedAt!,
        },
      }
    }

    throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
  }

  async findMany(filters?: { sourceType?: string }): Promise<DetectTarget[]> {
    const connection = await TransactionManager.getConnection()
    let query = connection
      .select({
        // データソース
        dataSourceId: dataSources.id,
        dataSourceType: dataSources.sourceType,
        dataSourceSourceId: dataSources.sourceId,
        dataSourceName: dataSources.name,
        dataSourceDescription: dataSources.description,
        dataSourceUrl: dataSources.url,
        dataSourceIsPrivate: dataSources.isPrivate,
        dataSourceCreatedAt: dataSources.createdAt,
        dataSourceUpdatedAt: dataSources.updatedAt,
        // リポジトリ
        repositoryId: repositories.id,
        repositoryGithubId: repositories.githubId,
        repositoryFullName: repositories.fullName,
        repositoryLanguage: repositories.language,
        repositoryStarsCount: repositories.starsCount,
        repositoryForksCount: repositories.forksCount,
        repositoryOpenIssuesCount: repositories.openIssuesCount,
        repositoryIsFork: repositories.isFork,
        repositoryCreatedAt: repositories.createdAt,
        repositoryUpdatedAt: repositories.updatedAt,
      })
      .from(dataSources)
      .innerJoin(repositories, eq(dataSources.id, repositories.dataSourceId))
      .$dynamic()

    if (filters?.sourceType) {
      query = query.where(eq(dataSources.sourceType, filters.sourceType))
    }

    const results = await query
    return results.map((row) => {
      if (row.dataSourceType === "github") {
        return {
          id: toDetectTargetId(row.dataSourceId),
          sourceType: "github" as const,
          sourceId: row.dataSourceSourceId,
          name: row.dataSourceName,
          description: row.dataSourceDescription,
          url: row.dataSourceUrl,
          isPrivate: row.dataSourceIsPrivate,
          createdAt: row.dataSourceCreatedAt,
          updatedAt: row.dataSourceUpdatedAt,
          repository: {
            id: row.repositoryId,
            githubId: row.repositoryGithubId,
            fullName: row.repositoryFullName,
            owner: row.repositoryFullName.split("/")[0] || "",
            language: row.repositoryLanguage,
            starsCount: row.repositoryStarsCount,
            forksCount: row.repositoryForksCount,
            openIssuesCount: row.repositoryOpenIssuesCount,
            isFork: row.repositoryIsFork,
            createdAt: row.repositoryCreatedAt!,
            updatedAt: row.repositoryUpdatedAt!,
          },
        }
      }
      throw new Error(`Unsupported sourceType: ${row.dataSourceType}`)
    })
  }
}
