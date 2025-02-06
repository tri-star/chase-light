export class DbRelationError extends Error {
  public table: string

  constructor(table: string, message: string) {
    super(message)
    this.name = 'DbRelationError'
    this.table = table
  }
}
