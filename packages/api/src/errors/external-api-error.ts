import { isFetchError, type FetchError } from '@/lib/utils/fetch-utils'

export class ExternalServiceError extends Error {
  name: string = 'ExternalServiceError'
  detailedMessage: string | undefined
  cause: Error | undefined

  context: Record<string, unknown> = {}

  /**
   *
   * @param message レスポンスとして返したり画面に表示する用の簡易的なメッセージ
   * @param detailedMessage 詳細な原因を含んだメッセージ
   * @param cause
   */
  constructor(
    message: string,
    detailedMessage?: string,
    cause?: Error,
    context: Record<string, unknown> = {},
  ) {
    super(message, { cause: cause })
    this.detailedMessage = detailedMessage
    this.cause = cause
    this.context = context
  }

  static fromUnknownError(
    e: unknown,
    message?: string,
    context: Record<string, unknown> = {},
  ) {
    if (isFetchError(e)) {
      return ExternalServiceError.fromFetchError(e, message, context)
    } else if (e instanceof Error) {
      return new ExternalServiceError(
        'E2: ' + (message ?? e.message),
        e.message,
        e,
        context,
      )
    }
    return new ExternalServiceError(
      'E3: ' + (message ?? 'Unknown Error'),
      undefined,
      undefined,
      context,
    )
  }

  /**
   *
   * @param e
   * @param message レスポンスとして返したり画面に表示する用の簡易的なメッセージ
   * @returns
   */
  static fromFetchError(
    e: FetchError,
    message?: string,
    context: Record<string, unknown> = {},
  ) {
    const statusCodeText = e.status ? `(${e.status})` : ''

    const baseDetailedMessage: string =
      e.cause?.message ?? 'External Service Error'
    const detailedMessage = `${baseDetailedMessage}${statusCodeText}`

    return new ExternalServiceError(
      message ?? detailedMessage,
      detailedMessage,
      e as Error,
      context,
    )
  }

  getDetailedMessageWithStack() {
    const stackText = this.cause ? this.cause.stack : ''
    const contextText = JSON.stringify(this.context, null, 2)
    return `${this.detailedMessage}\n${contextText}\n${stackText}`
  }
}
