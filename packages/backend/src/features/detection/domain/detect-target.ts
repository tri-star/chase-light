/**
 * 監視機能関連の型定義
 */

import { Brand } from "../../../core/utils/types"

export type DetectTargetId = Brand<string, "DetectTargetId">

export function toDetectTargetId(id: string): DetectTargetId {
  return id as DetectTargetId
}

/**
 * GitHubリポジトリのドメイン型定義（repository.tsから統合）
 * dataSourceIdフィールドを削除してDataSource内包形式にする
 */
export type Repository = {
  id: string
  githubId: number
  fullName: string
  owner: string
  language: string | null
  starsCount: number
  forksCount: number
  openIssuesCount: number
  isFork: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * データソース（監視対象）の型
 */
export type DetectTarget = {
  id: DetectTargetId
  sourceType: "github"
  sourceId: string
  name: string
  description: string
  url: string
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
  repository: Repository
}

export function isGitHubDataSource(
  detectTarget: DetectTarget,
): detectTarget is DetectTarget {
  return detectTarget.sourceType === "github"
}
