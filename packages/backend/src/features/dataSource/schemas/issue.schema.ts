import { z } from "zod/v4"
import {
  repositoryOwnerSchema,
  githubRepositoryOwnerApiSchema,
} from "./repository.schema"

/**
 * Label Schema (Core)
 * 内部のLabelオブジェクト用のスキーマ
 */
export const labelSchema = z.object({
  id: z.number().int().positive("ラベルIDは正の整数である必要があります"),
  name: z.string().min(1, "ラベル名は必須です"),
  description: z.string().nullable(),
  color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/, "カラーコードは6桁の16進数である必要があります"),
})

/**
 * GitHub API Label Schema
 * GitHub API固有のLabelスキーマ
 */
export const githubLabelApiSchema = z.object({
  id: z.number().int().positive("ラベルIDは正の整数である必要があります"),
  name: z.string().min(1, "ラベル名は必須です"),
  description: z.string().nullable(),
  color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/, "カラーコードは6桁の16進数である必要があります"),
})

/**
 * Milestone Schema (Core)
 * 内部のMilestoneオブジェクト用のスキーマ
 */
export const milestoneSchema = z.object({
  id: z
    .number()
    .int()
    .positive("マイルストーンIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("マイルストーン番号は正の整数である必要があります"),
  title: z.string().min(1, "マイルストーンタイトルは必須です"),
  description: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  dueOn: z.string().nullable(),
  closedAt: z.string().nullable(),
})

/**
 * GitHub API Milestone Schema
 * GitHub API固有のMilestoneスキーマ
 */
export const githubMilestoneApiSchema = z.object({
  id: z
    .number()
    .int()
    .positive("マイルストーンIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("マイルストーン番号は正の整数である必要があります"),
  title: z.string().min(1, "マイルストーンタイトルは必須です"),
  description: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  created_at: z.string(),
  updated_at: z.string(),
  due_on: z.string().nullable(),
  closed_at: z.string().nullable(),
})

/**
 * Issue Schema (Core)
 * 内部のIssueオブジェクト用のスキーマ
 */
export const issueSchema = z.object({
  id: z.number().int().positive("イシューIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("イシュー番号は正の整数である必要があります"),
  title: z.string().min(1, "イシュータイトルは必須です"),
  body: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable(),
  htmlUrl: z.string().url("HTMLURLが不正です"),
  user: repositoryOwnerSchema,
  assignees: z.array(repositoryOwnerSchema).default([]),
  labels: z.array(labelSchema).default([]),
  milestone: milestoneSchema.nullable(),
  comments: z.number().int().min(0, "コメント数は0以上である必要があります"),
  isPullRequest: z.boolean(),
})

/**
 * GitHub API Issue Schema
 * GitHub API固有のIssueスキーマ
 */
export const githubIssueApiSchema = z.object({
  id: z.number().int().positive("イシューIDは正の整数である必要があります"),
  number: z
    .number()
    .int()
    .positive("イシュー番号は正の整数である必要があります"),
  title: z.string().min(1, "イシュータイトルは必須です"),
  body: z.string().nullable(),
  state: z.enum(
    ["open", "closed"],
    "状態はopenまたはclosedである必要があります",
  ),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
  html_url: z.string().url("HTMLURLが不正です"),
  user: githubRepositoryOwnerApiSchema,
  assignees: z.array(githubRepositoryOwnerApiSchema).default([]),
  labels: z.array(githubLabelApiSchema).default([]),
  milestone: githubMilestoneApiSchema.nullable(),
  comments: z.number().int().min(0, "コメント数は0以上である必要があります"),
  pull_request: z.object({}).optional(), // Pull Requestの場合に存在するフィールド
})

// 型推論の生成
export type Issue = z.infer<typeof issueSchema>
export type Label = z.infer<typeof labelSchema>
export type Milestone = z.infer<typeof milestoneSchema>
