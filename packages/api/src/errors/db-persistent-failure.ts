export class DbPersistentFailureError extends Error {
  public table: string

  constructor(table: string, message: string) {
    super(message)
    this.name = 'PersistentFailure'
    this.table = table
  }
}
