import { z } from "zod/v4"

/**
 * Repository Owner Schema (Core)
 * 内部のRepositoryOwnerオブジェクト用のスキーマ
 */
export const repositoryOwnerSchema = z.object({
  login: z.string().min(1, "ログイン名は必須です"),
  id: z.number().int().positive("IDは正の整数である必要があります"),
  avatarUrl: z.string().url("アバターURLが不正です"),
  htmlUrl: z.string().url("HTMLURLが不正です"),
  type: z.enum(
    ["User", "Organization"],
    "タイプはUserまたはOrganizationである必要があります",
  ),
})

/**
 * GitHub API Repository Owner Schema
 * GitHub API固有のRepositoryOwnerスキーマ
 */
export const githubRepositoryOwnerApiSchema = z.object({
  login: z.string().min(1, "ログイン名は必須です"),
  id: z.number().int().positive("IDは正の整数である必要があります"),
  avatar_url: z.string().url("アバターURLが不正です"),
  html_url: z.string().url("HTMLURLが不正です"),
  type: z.enum(
    ["User", "Organization"],
    "タイプはUserまたはOrganizationである必要があります",
  ),
})

/**
 * License Schema (Core)
 * 内部のLicenseオブジェクト用のスキーマ
 */
export const licenseSchema = z.object({
  key: z.string().min(1, "ライセンスキーは必須です"),
  name: z.string().min(1, "ライセンス名は必須です"),
  spdxId: z.string().nullable(),
  url: z.string().url().nullable(),
})

/**
 * GitHub API License Schema
 * GitHub API固有のLicenseスキーマ
 */
export const githubLicenseApiSchema = z.object({
  key: z.string().min(1, "ライセンスキーは必須です"),
  name: z.string().min(1, "ライセンス名は必須です"),
  spdx_id: z.string().nullable(),
  url: z.string().url().nullable(),
})

/**
 * Repository Schema (Core)
 * 内部のRepositoryオブジェクト用のスキーマ
 */
export const repositorySchema = z.object({
  id: z.number().int().positive("リポジトリIDは正の整数である必要があります"),
  name: z.string().min(1, "リポジトリ名は必須です"),
  fullName: z.string().min(1, "フル名は必須です"),
  description: z.string().nullable(),
  htmlUrl: z.string().url("HTMLURLが不正です"),
  cloneUrl: z.string().url("クローンURLが不正です"),
  stargazersCount: z
    .number()
    .int()
    .min(0, "スター数は0以上である必要があります"),
  watchersCount: z
    .number()
    .int()
    .min(0, "ウォッチャー数は0以上である必要があります"),
  forksCount: z.number().int().min(0, "フォーク数は0以上である必要があります"),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  defaultBranch: z.string().min(1, "デフォルトブランチは必須です"),
  createdAt: z.string(),
  updatedAt: z.string(),
  pushedAt: z.string().nullable(),
  owner: repositoryOwnerSchema,
  license: licenseSchema.nullable(),
})

/**
 * GitHub API Repository Schema
 * GitHub API固有のRepositoryスキーマ
 */
export const githubRepositoryApiSchema = z.object({
  id: z.number().int().positive("リポジトリIDは正の整数である必要があります"),
  name: z.string().min(1, "リポジトリ名は必須です"),
  full_name: z.string().min(1, "フル名は必須です"),
  description: z.string().nullable(),
  html_url: z.string().url("HTMLURLが不正です"),
  clone_url: z.string().url("クローンURLが不正です"),
  stargazers_count: z
    .number()
    .int()
    .min(0, "スター数は0以上である必要があります"),
  watchers_count: z
    .number()
    .int()
    .min(0, "ウォッチャー数は0以上である必要があります"),
  forks_count: z.number().int().min(0, "フォーク数は0以上である必要があります"),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  private: z.boolean(),
  fork: z.boolean(),
  archived: z.boolean(),
  default_branch: z.string().min(1, "デフォルトブランチは必須です"),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable(),
  owner: githubRepositoryOwnerApiSchema,
  license: githubLicenseApiSchema.nullable(),
})

// 型推論の生成
export type Repository = z.infer<typeof repositorySchema>
export type RepositoryOwner = z.infer<typeof repositoryOwnerSchema>
export type License = z.infer<typeof licenseSchema>
