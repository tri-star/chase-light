import { fakerJA } from "@faker-js/faker"
import { uuidv7 } from "uuidv7"
import {
  DATA_SOURCE_TYPES,
  type GitHubDataSourceCreationInput,
  type RepositoryCreationInput,
} from "../data-source"
import type { UserWatchCreationInput } from "../user-watch"

export type TestDataSourceDefinition = {
  id: string
  githubId: number
  repositoryId: string
  name: string
  fullName: string
}

export const TEST_DATA_SOURCES: TestDataSourceDefinition[] = [
  {
    id: "019ab6f5-5559-7bc9-a6fe-db07be1be93c",
    githubId: 187412,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad75",
    name: "gpt-copilot",
    fullName: "openai/gpt-copilot",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea50340d71e0",
    githubId: 172474,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad76",
    name: "turbo-drive",
    fullName: "vercel/turbo-drive",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea51f9dd1f95",
    githubId: 764472,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad77",
    name: "pages-kit",
    fullName: "cloudflare/pages-kit",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea526f217088",
    githubId: 515179,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad78",
    name: "vector-explorer",
    fullName: "supabase/vector-explorer",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea538d496759",
    githubId: 153890,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad79",
    name: "edge-stack",
    fullName: "remix-run/edge-stack",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5437ae7f4a",
    githubId: 158803,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad80",
    name: "starfield",
    fullName: "withastro/starfield",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea55869403b1",
    githubId: 726317,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad81",
    name: "aurora-theme",
    fullName: "nuxt/aurora-theme",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea56e0bc221f",
    githubId: 605120,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad82",
    name: "fresh-lab",
    fullName: "denoland/fresh-lab",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea57c8ce2e62",
    githubId: 226028,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad83",
    name: "open-next",
    fullName: "sst/open-next",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea58b4e0b78a",
    githubId: 869203,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad84",
    name: "edge-client",
    fullName: "prisma/edge-client",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5910edcdcd",
    githubId: 169642,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad85",
    name: "hydrogen-lite",
    fullName: "shopify/hydrogen-lite",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5af239984f",
    githubId: 448758,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad86",
    name: "api-playground",
    fullName: "stripe/api-playground",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5b63ada16b",
    githubId: 269360,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad87",
    name: "link-simulator",
    fullName: "plaid/link-simulator",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5ccb758f81",
    githubId: 629037,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad88",
    name: "trace-studio",
    fullName: "getsentry/trace-studio",
  },
  {
    id: "019ab6f5-555a-764b-95a8-ea5dd24a9440",
    githubId: 918978,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad89",
    name: "logboard",
    fullName: "DataDog/logboard",
  },
  {
    id: "019ab6f5-555b-7643-b3fc-beb9219373f8",
    githubId: 446132,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad90",
    name: "http-kit",
    fullName: "axios/http-kit",
  },
  {
    id: "019ab6f5-555b-7643-b3fc-bebaed918893",
    githubId: 522662,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad91",
    name: "query-tools",
    fullName: "tanstack/query-tools",
  },
  {
    id: "019ab6f5-555b-7643-b3fc-bebb60f72b1a",
    githubId: 320896,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad92",
    name: "lab-tools",
    fullName: "drizzle-team/lab-tools",
  },
  {
    id: "019ab6f5-555b-7643-b3fc-bebc896b7063",
    githubId: 357001,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad93",
    name: "beam",
    fullName: "chakra-ui/beam",
  },
  {
    id: "019ab6f5-555b-7643-b3fc-bebd2d4837fa",
    githubId: 503565,
    repositoryId: "019abba4-7375-7132-922c-12a7179cad94",
    name: "canvas-lab",
    fullName: "storybookjs/canvas-lab",
  },
] as const

export type DataSourceSeed = GitHubDataSourceCreationInput & {
  id: string
  repository: RepositoryCreationInput & { id: string }
  createdAt: Date
  updatedAt: Date
}

export type UserWatchSeed = UserWatchCreationInput & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export function createDataSource(
  definition: TestDataSourceDefinition,
): DataSourceSeed {
  const now = new Date()
  return {
    id: definition.id,
    sourceType: DATA_SOURCE_TYPES.GITHUB,
    sourceId: definition.repositoryId,
    name: definition.name,
    description: fakerJA.lorem.sentence(),
    url: `https://github.com/${definition.fullName}`,
    isPrivate: false,
    repository: createRepository(definition, now),
    createdAt: now,
    updatedAt: now,
  }
}

export function createUserWatch(
  userId: string,
  dataSourceId: string,
): UserWatchSeed {
  const now = new Date()
  return {
    id: uuidv7(),
    userId,
    dataSourceId,
    notificationEnabled: true,
    watchReleases: true,
    watchIssues: true,
    watchPullRequests: true,
    addedAt: now,
    createdAt: now,
    updatedAt: now,
  }
}

function createRepository(
  definition: TestDataSourceDefinition,
  now: Date,
): RepositoryCreationInput & { id: string } {
  return {
    id: definition.repositoryId,
    githubId: definition.githubId,
    fullName: definition.fullName,
    language: "TypeScript",
    starsCount: fakerJA.number.int({ min: 0, max: 1000 }),
    forksCount: fakerJA.number.int({ min: 0, max: 1000 }),
    openIssuesCount: fakerJA.number.int({ min: 0, max: 1000 }),
    isFork: false,
    createdAt: now,
    updatedAt: now,
  }
}
