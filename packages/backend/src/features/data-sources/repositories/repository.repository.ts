import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../shared/db/transaction-manager"
import { repositories } from "../../../db/schema"
import type { Repository, RepositoryCreationInput } from "../domain"

/**
 * GitHubリポジトリのリポジトリクラス
 * 既存のUserRepositoryパターンに従った実装
 */
export class RepositoryRepository {
  /**
   * リポジトリを保存（作成・更新）
   */
  async save(data: RepositoryCreationInput): Promise<Repository> {
    const now = new Date()
    const id = randomUUID()

    const [result] = await TransactionManager.getConnection()
      .insert(repositories)
      .values({
        id,
        dataSourceId: data.dataSourceId,
        githubId: data.githubId,
        fullName: data.fullName,
        language: data.language,
        starsCount: data.starsCount,
        forksCount: data.forksCount,
        openIssuesCount: data.openIssuesCount,
        isFork: data.isFork,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [repositories.githubId],
        set: {
          dataSourceId: data.dataSourceId,
          fullName: data.fullName,
          language: data.language,
          starsCount: data.starsCount,
          forksCount: data.forksCount,
          openIssuesCount: data.openIssuesCount,
          isFork: data.isFork,
          updatedAt: now,
        },
      })
      .returning()

    return this.mapToDomain(result)
  }

  /**
   * IDでリポジトリを検索
   */
  async findById(id: string): Promise<Repository | null> {
    const result = await TransactionManager.getConnection()
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * データソースIDでリポジトリを検索
   */
  async findByDataSourceId(dataSourceId: string): Promise<Repository | null> {
    const result = await TransactionManager.getConnection()
      .select()
      .from(repositories)
      .where(eq(repositories.dataSourceId, dataSourceId))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * GitHub IDでリポジトリを検索
   */
  async findByGithubId(githubId: number): Promise<Repository | null> {
    const result = await TransactionManager.getConnection()
      .select()
      .from(repositories)
      .where(eq(repositories.githubId, githubId))

    return result.length > 0 ? this.mapToDomain(result[0]) : null
  }

  /**
   * リポジトリを削除
   */
  async delete(id: string): Promise<boolean> {
    const result = await TransactionManager.getConnection()
      .delete(repositories)
      .where(eq(repositories.id, id))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * データベース結果をドメイン型に変換
   */
  private mapToDomain(row: typeof repositories.$inferSelect): Repository {
    return {
      id: row.id,
      dataSourceId: row.dataSourceId,
      githubId: row.githubId,
      fullName: row.fullName,
      owner: row.fullName.split("/")[0] || "",
      language: row.language,
      starsCount: row.starsCount,
      forksCount: row.forksCount,
      openIssuesCount: row.openIssuesCount,
      isFork: row.isFork,
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
    }
  }
}
