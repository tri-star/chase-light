import { z } from "@hono/zod-openapi"

/**
 * Repository Owner Schema (Core)
 * 内部のRepositoryOwnerオブジェクト用のスキーマ
 */
export const repositoryOwnerSchema = z
  .object({
    login: z.string().min(1, "ログイン名は必須です").openapi({
      example: "facebook",
      description: "GitHubユーザー名または組織名",
    }),
    id: z.number().int().positive("IDは正の整数である必要があります").openapi({
      example: 69631,
      description: "GitHubユーザーまたは組織の一意ID",
    }),
    avatarUrl: z.string().url("アバターURLが不正です").openapi({
      example: "https://avatars.githubusercontent.com/u/69631?v=4",
      description: "プロフィール画像のURL",
    }),
    htmlUrl: z.string().url("HTMLURLが不正です").openapi({
      example: "https://github.com/facebook",
      description: "GitHubプロフィールページのURL",
    }),
    type: z
      .enum(
        ["User", "Organization"],
        "タイプはUserまたはOrganizationである必要があります",
      )
      .openapi({
        example: "Organization",
        description: "アカウントの種類",
      }),
  })
  .openapi("RepositoryOwner")

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
export const licenseSchema = z
  .object({
    key: z.string().min(1, "ライセンスキーは必須です").openapi({
      example: "mit",
      description: "ライセンスの識別キー",
    }),
    name: z.string().min(1, "ライセンス名は必須です").openapi({
      example: "MIT License",
      description: "ライセンスの正式名称",
    }),
    spdxId: z.string().nullable().openapi({
      example: "MIT",
      description: "SPDX License Identifier",
    }),
    url: z.string().url().nullable().openapi({
      example: "https://api.github.com/licenses/mit",
      description: "ライセンス情報のURL",
    }),
  })
  .openapi("License")

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
export const repositorySchema = z
  .object({
    id: z
      .number()
      .int()
      .positive("リポジトリIDは正の整数である必要があります")
      .openapi({
        example: 10270250,
        description: "GitHubリポジトリの一意ID",
      }),
    name: z.string().min(1, "リポジトリ名は必須です").openapi({
      example: "react",
      description: "リポジトリ名",
    }),
    fullName: z.string().min(1, "フル名は必須です").openapi({
      example: "facebook/react",
      description: "オーナー名/リポジトリ名の形式",
    }),
    description: z.string().nullable().openapi({
      example: "The library for web and native user interfaces.",
      description: "リポジトリの説明",
    }),
    htmlUrl: z.string().url("HTMLURLが不正です").openapi({
      example: "https://github.com/facebook/react",
      description: "GitHubリポジトリページのURL",
    }),
    cloneUrl: z.string().url("クローンURLが不正です").openapi({
      example: "https://github.com/facebook/react.git",
      description: "Gitクローン用のURL",
    }),
    stargazersCount: z
      .number()
      .int()
      .min(0, "スター数は0以上である必要があります")
      .openapi({
        example: 228000,
        description: "スター数",
      }),
    watchersCount: z
      .number()
      .int()
      .min(0, "ウォッチャー数は0以上である必要があります")
      .openapi({
        example: 6900,
        description: "ウォッチャー数",
      }),
    forksCount: z
      .number()
      .int()
      .min(0, "フォーク数は0以上である必要があります")
      .openapi({
        example: 46000,
        description: "フォーク数",
      }),
    language: z.string().nullable().openapi({
      example: "JavaScript",
      description: "主要なプログラミング言語",
    }),
    topics: z
      .array(z.string())
      .default([])
      .openapi({
        example: ["javascript", "react", "frontend"],
        description: "リポジトリのトピック一覧",
      }),
    isPrivate: z.boolean().openapi({
      example: false,
      description: "プライベートリポジトリかどうか",
    }),
    isFork: z.boolean().openapi({
      example: false,
      description: "フォークされたリポジトリかどうか",
    }),
    isArchived: z.boolean().openapi({
      example: false,
      description: "アーカイブされたリポジトリかどうか",
    }),
    defaultBranch: z.string().min(1, "デフォルトブランチは必須です").openapi({
      example: "main",
      description: "デフォルトブランチ名",
    }),
    createdAt: z.string().openapi({
      example: "2013-05-24T16:15:54Z",
      description: "リポジトリの作成日時（ISO 8601形式）",
    }),
    updatedAt: z.string().openapi({
      example: "2024-12-20T10:30:45Z",
      description: "最終更新日時（ISO 8601形式）",
    }),
    pushedAt: z.string().nullable().openapi({
      example: "2024-12-20T08:15:30Z",
      description: "最終プッシュ日時（ISO 8601形式）",
    }),
    owner: repositoryOwnerSchema,
    license: licenseSchema.nullable(),
  })
  .openapi("Repository")

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
