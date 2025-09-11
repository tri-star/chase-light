/**
 * ページネーションヘルパー関数
 * 配列データに対するクライアントサイドページネーションを提供
 */

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationResult<T> {
  paginatedItems: T[]
  meta: PaginationMeta
}

/**
 * 配列データをページネーションする
 * @param items - ページネーション対象の配列
 * @param page - 現在のページ番号（1から開始）
 * @param perPage - 1ページあたりのアイテム数
 * @returns ページネーション結果とメタ情報
 */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): PaginationResult<T> {
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    paginatedItems,
    meta: {
      page,
      perPage,
      total: items.length,
      hasNext: endIndex < items.length,
      hasPrev: page > 1,
    },
  }
}

/**
 * GitHubのレスポンス形式に基づくページネーションメタ情報を生成
 * @param page - 現在のページ番号
 * @param perPage - 1ページあたりのアイテム数
 * @param itemsLength - 実際に取得されたアイテム数
 * @returns GitHubのページネーション仕様に準拠したメタ情報
 */
export function createGitHubPaginationMeta(
  page: number,
  perPage: number,
  itemsLength: number,
): Omit<PaginationMeta, "total"> {
  return {
    page,
    perPage,
    hasNext: itemsLength === perPage,
    hasPrev: page > 1,
  }
}
