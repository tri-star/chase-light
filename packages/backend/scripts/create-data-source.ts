#!/usr/bin/env tsx

import { fileURLToPath } from "url"
import { resolve } from "path"
import { DataSourceCreationService } from "../src/features/data-sources/services/data-source-creation.service"
import { DataSourceRepository } from "../src/features/data-sources/repositories/data-source.repository"
import { createGitHubApiService } from "../src/features/data-sources/services/github-api-service.factory"
import { connectDb, disconnectDb } from "../src/db/connection"

/**
 * コマンドライン引数を解析
 */
function parseArguments(): { repositoryUrl: string } {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/create-data-source.ts <repository-url>",
    )
    console.error(
      "Example: npx tsx scripts/create-data-source.ts https://github.com/owner/repo",
    )
    process.exit(1)
  }

  const repositoryUrl = args[0]

  if (!repositoryUrl.startsWith("https://github.com/")) {
    console.error(
      "Error: Repository URL must be a GitHub URL starting with https://github.com/",
    )
    process.exit(1)
  }

  return { repositoryUrl }
}

/**
 * メイン処理
 */
async function main() {
  try {
    const { repositoryUrl } = parseArguments()

    console.log(`Creating data source for repository: ${repositoryUrl}`)

    // データベース接続を初期化
    await connectDb()

    // リポジトリインスタンスを作成
    const dataSourceRepository = new DataSourceRepository()

    // GitHubApiServiceを作成
    const githubApiService = createGitHubApiService()

    // サービスインスタンスを作成
    const dataSourceCreationService = new DataSourceCreationService(
      dataSourceRepository,
      githubApiService,
    )

    // データソースを作成
    const result = await dataSourceCreationService.execute({
      repositoryUrl,
    })

    // 結果を出力
    const output = {
      success: true,
      dataSource: {
        ...result.dataSource,
        createdAt: result.dataSource.createdAt.toISOString(),
        updatedAt: result.dataSource.updatedAt.toISOString(),
        repository: {
          ...result.dataSource.repository,
          createdAt: result.dataSource.repository.createdAt.toISOString(),
          updatedAt: result.dataSource.repository.updatedAt.toISOString(),
        },
      },
    }

    console.log(JSON.stringify(output, null, 2))

    console.log(
      `✅ Successfully created data source for ${result.dataSource.repository.fullName}`,
    )
  } catch (error) {
    console.error("❌ Error creating data source:")

    if (error instanceof Error) {
      console.error(`  ${error.message}`)
    } else {
      console.error(`  ${String(error)}`)
    }

    const errorOutput = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : "UnknownError",
      },
    }

    console.error(JSON.stringify(errorOutput, null, 2))
    process.exit(1)
  } finally {
    // データベース接続を閉じる
    await disconnectDb()
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
// ESモジュールでは import.meta.url を使用
const scriptPath = resolve(fileURLToPath(import.meta.url))
const executedPath = resolve(process.argv[1])

if (scriptPath === executedPath) {
  main()
}
