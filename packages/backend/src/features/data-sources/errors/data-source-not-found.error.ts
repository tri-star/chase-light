/**
 * データソースが見つからない、またはアクセス権限がない場合のエラー
 */
export class DataSourceNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DataSourceNotFoundError"
  }
}