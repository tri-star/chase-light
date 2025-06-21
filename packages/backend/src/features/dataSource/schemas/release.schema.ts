import { z } from "zod/v4"
import {
  repositoryOwnerSchema,
  githubRepositoryOwnerApiSchema,
} from "./repository.schema"

/**
 * Release Asset Schema (Core)
 * 内部のReleaseAssetオブジェクト用のスキーマ
 */
export const releaseAssetSchema = z.object({
  id: z.number().int().positive("アセットIDは正の整数である必要があります"),
  name: z.string().min(1, "アセット名は必須です"),
  label: z.string().nullable(),
  contentType: z.string().min(1, "コンテンツタイプは必須です"),
  size: z.number().int().min(0, "サイズは0以上である必要があります"),
  downloadCount: z
    .number()
    .int()
    .min(0, "ダウンロード数は0以上である必要があります"),
  createdAt: z.string(),
  updatedAt: z.string(),
  browserDownloadUrl: z.string(),
})

/**
 * GitHub API Release Asset Schema
 * GitHub API固有のReleaseAssetスキーマ
 */
export const githubReleaseAssetApiSchema = z.object({
  id: z.number().int().positive("アセットIDは正の整数である必要があります"),
  name: z.string().min(1, "アセット名は必須です"),
  label: z.string().nullable(),
  content_type: z.string().min(1, "コンテンツタイプは必須です"),
  size: z.number().int().min(0, "サイズは0以上である必要があります"),
  download_count: z
    .number()
    .int()
    .min(0, "ダウンロード数は0以上である必要があります"),
  created_at: z.string(),
  updated_at: z.string(),
  browser_download_url: z.string(),
})

/**
 * Release Schema (Core)
 * 内部のReleaseオブジェクト用のスキーマ
 */
export const releaseSchema = z.object({
  id: z.number().int().positive("リリースIDは正の整数である必要があります"),
  tagName: z.string().min(1, "タグ名は必須です"),
  name: z.string().nullable(),
  body: z.string().nullable(),
  isDraft: z.boolean(),
  isPrerelease: z.boolean(),
  createdAt: z.string(),
  publishedAt: z.string().nullable(),
  htmlUrl: z.string(),
  tarballUrl: z.string().nullable(),
  zipballUrl: z.string().nullable(),
  author: repositoryOwnerSchema,
  assets: z.array(releaseAssetSchema).default([]),
})

/**
 * GitHub API Release Schema
 * GitHub API固有のReleaseスキーマ
 */
export const githubReleaseApiSchema = z.object({
  id: z.number().int().positive("リリースIDは正の整数である必要があります"),
  tag_name: z.string().min(1, "タグ名は必須です"),
  name: z.string().nullable(),
  body: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  created_at: z.string(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  tarball_url: z.string().nullable(),
  zipball_url: z.string().nullable(),
  author: githubRepositoryOwnerApiSchema,
  assets: z.array(githubReleaseAssetApiSchema).default([]),
})

// 型推論の生成
export type Release = z.infer<typeof releaseSchema>
export type ReleaseAsset = z.infer<typeof releaseAssetSchema>
