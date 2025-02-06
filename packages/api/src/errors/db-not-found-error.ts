export class DbNotFoundError extends Error {
  public table: string

  constructor(table: string, message: string) {
    super(message)
    this.name = 'DbNotFoundError'
    this.table = table
  }
}
