import { isFetchError, type FetchError } from '@/lib/utils/fetch-utils'

export class ExternalServiceError extends Error {
  name: string = 'ExternalServiceError'
  detailedMessage: string | undefined
  cause: Error | undefined

  /**
   *
   * @param message レスポンスとして返したり画面に表示する用の簡易的なメッセージ
   * @param detailedMessage 詳細な原因を含んだメッセージ
   * @param cause
   */
  constructor(message: string, detailedMessage?: string, cause?: Error) {
    super(message, { cause: cause })
    this.detailedMessage = detailedMessage
    this.cause = cause
  }

  static fromUnknownError(e: unknown, message?: string) {
    if (isFetchError(e)) {
      return ExternalServiceError.fromFetchError(e)
    } else if (e instanceof Error) {
      return new ExternalServiceError(message ?? e.message, e.message, e)
    }
    return new ExternalServiceError(message ?? 'Unknown Error', undefined)
  }

  /**
   *
   * @param e
   * @param message レスポンスとして返したり画面に表示する用の簡易的なメッセージ
   * @returns
   */
  static fromFetchError(e: FetchError, message?: string) {
    const statusCodeText = e.status ? `(${e.status})` : ''

    const baseDetailedMessage: string =
      e.cause?.message ?? 'External Service Error'
    const detailedMessage = `${baseDetailedMessage}${statusCodeText}`

    return new ExternalServiceError(
      message ?? detailedMessage,
      detailedMessage,
      e as Error,
    )
  }

  getDetailedMessageWithStack() {
    const stackText = this.cause ? this.cause.stack : ''
    return `${this.detailedMessage}\n${stackText}`
  }
}
