/**
 * ユーザーが見つからない場合のエラー
 */
export class UserNotFoundError extends Error {
  constructor(auth0UserId: string) {
    super(`User not found for auth0UserId: ${auth0UserId}`)
    this.name = "UserNotFoundError"
  }
}
