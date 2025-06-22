import { z } from "zod/v4"
import {
  repositoryOwnerSchema,
  repositorySchema,
  githubRepositoryApiSchema,
  githubRepositoryOwnerApiSchema,
} from "./repository.schema"
import { labelSchema, githubLabelApiSchema } from "./issue.schema"

/**
 * Pull Request Branch Schema (Core)
 * Pull Requestのブランチ情報を表すスキーマ（循環参照あり）
 */
export const pullRequestBranchSchema = z.object({
  ref: z.string().min(1, "ブランチ参照は必須です"),
  sha: z
    .string()
    .regex(/^[0-9a-fA-F]{40}$/, "SHAは40文字の16進数である必要があります"),
  label: z.string().min(1, "ブランチラベルは必須です"),
  repo: z
    .lazy(() => repositorySchema)
    .nullable()
    .openapi({
      type: "object",
      description: "Repository information for the branch",
    }), // 循環参照対応
})

/**
 * GitHub API Pull Request Branch Schema
 * GitHub API固有のブランチスキーマ
 */
export const githubPullRequestBranchApiSchema = z.object({
  ref: z.string().min(1, "ブランチ参照は必須です"),
  sha: z
    .string()
    .regex(/^[0-9a-fA-F]{40}$/, "SHAは40文字の16進数である必要があります"),
  label: z.string().min(1, "ブランチラベルは必須です"),
  repo: z
    .lazy(() => githubRepositoryApiSchema)
    .nullable()
    .openapi({
      type: "object",
      description: "GitHub API Repository reference",
    }), // GitHub API Repository参照
})

/**
 * Pull Request Core Schema
 * 内部のPullRequestオブジェクト用のシンプルなスキーマ
 */
export const pullRequestSchema = z.object({
  id: z
    .number()
    .int()
    .positive("プルリクエストIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("プルリクエスト番号は正の整数である必要があります"),
  title: z.string().min(1, "プルリクエストタイトルは必須です"),
  body: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  isDraft: z.boolean(),
  isMerged: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable(),
  mergedAt: z.string().nullable(),
  htmlUrl: z.string().url("HTMLURLが不正です"),
  head: pullRequestBranchSchema,
  base: pullRequestBranchSchema,
  user: repositoryOwnerSchema,
  assignees: z.array(repositoryOwnerSchema).default([]),
  reviewers: z.array(repositoryOwnerSchema).default([]),
  labels: z.array(labelSchema).default([]),
})

/**
 * GitHub API Pull Request Response Schema
 * GitHub API固有のフィールド名でのスキーマ（変換なし）
 */
export const githubPullRequestApiSchema = z.object({
  id: z
    .number()
    .int()
    .positive("プルリクエストIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("プルリクエスト番号は正の整数である必要があります"),
  title: z.string().min(1, "プルリクエストタイトルは必須です"),
  body: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  draft: z.boolean(),
  merged: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
  merged_at: z.string().nullable(),
  html_url: z.string().url("HTMLURLが不正です"),
  head: githubPullRequestBranchApiSchema,
  base: githubPullRequestBranchApiSchema,
  user: githubRepositoryOwnerApiSchema,
  assignees: z.array(githubRepositoryOwnerApiSchema).default([]),
  requested_reviewers: z.array(githubRepositoryOwnerApiSchema).default([]),
  labels: z.array(githubLabelApiSchema).default([]),
})

// 型推論の生成
export type PullRequest = z.infer<typeof pullRequestSchema>
export type PullRequestBranch = z.infer<typeof pullRequestBranchSchema>
