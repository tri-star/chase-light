#!/usr/bin/env tsx

import { fileURLToPath } from "url"
import { resolve } from "path"
import { connectDb, disconnectDb } from "../src/db/connection"
import { DrizzleDataSourceRepository } from "../src/features/data-sources/infra/repositories"
import { createGitHubRepositoryPort } from "../src/features/data-sources/infra/adapters/github-repository"
import { DATA_SOURCE_TYPES } from "../src/features/data-sources/domain"

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

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const pattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\.git)?\/?$/
  const match = url.match(pattern)

  if (!match) {
    console.error(`Error: Invalid GitHub repository URL: ${url}`)
    process.exit(1)
  }

  const owner = match[1]
  const repo = match[2].replace(/\.git$/, "")
  return { owner, repo }
}

async function main() {
  try {
    const { repositoryUrl } = parseArguments()
    console.log(`Creating data source for repository: ${repositoryUrl}`)

    await connectDb()

    const dataSourceRepository = new DrizzleDataSourceRepository()
    const githubRepositoryPort = createGitHubRepositoryPort()

    const { owner, repo } = parseGitHubUrl(repositoryUrl)
    const repository = await githubRepositoryPort.getRepository(owner, repo)

    const dataSource = await dataSourceRepository.save({
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: repository.id.toString(),
      name: repository.name,
      description: repository.description ?? "",
      url: repository.htmlUrl,
      isPrivate: repository.private,
      repository: {
        githubId: repository.id,
        fullName: repository.fullName,
        language: repository.language,
        starsCount: repository.stargazersCount,
        forksCount: repository.forksCount,
        openIssuesCount: repository.openIssuesCount,
        isFork: repository.fork,
      },
    })

    const output = {
      success: true as const,
      dataSource: {
        ...dataSource,
        createdAt: dataSource.createdAt.toISOString(),
        updatedAt: dataSource.updatedAt.toISOString(),
        repository: {
          ...dataSource.repository,
          createdAt: dataSource.repository.createdAt.toISOString(),
          updatedAt: dataSource.repository.updatedAt.toISOString(),
        },
      },
    }

    console.log(JSON.stringify(output, null, 2))
    console.log(
      `✅ Successfully created data source for ${dataSource.repository.fullName}`,
    )
  } catch (error) {
    console.error("❌ Error creating data source:")

    if (error instanceof Error) {
      console.error(`  ${error.message}`)
    } else {
      console.error(`  ${String(error)}`)
    }

    const errorOutput = {
      success: false as const,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : "UnknownError",
      },
    }

    console.error(JSON.stringify(errorOutput, null, 2))
    process.exit(1)
  } finally {
    await disconnectDb()
  }
}

const scriptPath = resolve(fileURLToPath(import.meta.url))
const executedPath = resolve(process.argv[1])

if (scriptPath === executedPath) {
  main()
}
