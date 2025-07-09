/**
 * データソース作成の重複エラー
 */
export class DuplicateDataSourceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DuplicateDataSourceError"
  }
}
