import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger, LogContext, LogLevel, LoggerOptions } from './types'

/**
 * リクエスト単位でロガーインスタンスを管理するためのストレージ
 */
export const loggerStorage = new AsyncLocalStorage<AppLogger>()

/**
 * デフォルトのロガー設定
 */
export const defaultLoggerOptions: LoggerOptions = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}

/**
 * ロガーの実装クラス
 */
export class AppLogger implements Logger {
  private readonly minLevel: LogLevel
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  // コンテキストデータをスタックで管理
  private contextStack: LogContext[] = [{}]

  /**
   * コンストラクタ
   * @param options ロガーオプション
   */
  constructor(options?: LoggerOptions) {
    this.minLevel = options?.minLevel || 'debug'
  }

  /**
   * 現在の実行コンテキストに関連付けられたロガーインスタンスを取得
   * 存在しない場合は新しいインスタンスを生成
   */
  public static getCurrentLogger(options?: LoggerOptions): AppLogger {
    const current = loggerStorage.getStore()
    if (current) {
      return current
    }

    // ストレージ外で呼び出された場合は新しいインスタンスを返す
    // (通常はミドルウェア経由で呼び出されるべき)
    console.warn(
      'Logger called outside request context, creating standalone instance.',
    )
    return new AppLogger(options)
  }

  /**
   * 新しいロガーインスタンスを作成し、指定した関数を実行中のみそのインスタンスをカレントに設定する
   * @param fn 実行する関数
   * @param options ロガーオプション
   */
  public static runWithNewLogger<T>(fn: () => T, options?: LoggerOptions): T {
    const logger = new AppLogger(options)
    return loggerStorage.run(logger, fn)
  }

  /**
   * 現在のコンテキストを取得
   */
  private getCurrentContext(): LogContext {
    return this.contextStack.reduce((acc, ctx) => ({ ...acc, ...ctx }), {})
  }

  /**
   * ログ出力が許可されているかどうか
   * @param level ログレベル
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.minLevel]
  }

  /**
   * ログ出力処理
   * @param level ログレベル
   * @param message メッセージ
   * @param context 追加コンテキスト
   * @param error エラーオブジェクト（エラーログの場合のみ）
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (!this.isLevelEnabled(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const baseContext = this.getCurrentContext()
    const fullContext = context ? { ...baseContext, ...context } : baseContext

    const logData = {
      timestamp,
      level,
      message,
      ...fullContext,
    }

    // エラーオブジェクトがある場合は追加情報を取得
    if (error && level === 'error') {
      Object.assign(logData, {
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
      })
    }

    // JSONフォーマットでログ出力
    // console関数を使いつつJSON形式で出力
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logData))
        break
      case 'info':
        console.info(JSON.stringify(logData))
        break
      case 'warn':
        console.warn(JSON.stringify(logData))
        break
      case 'error':
        console.error(JSON.stringify(logData))
        break
    }
  }

  /**
   * デバッグレベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * 情報レベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * 警告レベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * エラーレベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報
   * @param error エラーオブジェクト
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error || new Error(message))
  }

  /**
   * コンテキストを追加
   * @param context 追加するコンテキスト情報
   */
  addContext(context: LogContext): void {
    const currentContext = this.contextStack[this.contextStack.length - 1]
    this.contextStack[this.contextStack.length - 1] = {
      ...currentContext,
      ...context,
    }
  }

  /**
   * コンテキストを削除
   * @param keys 削除するキー名の配列
   */
  removeContext(keys: string[]): void {
    const currentContext = this.contextStack[this.contextStack.length - 1]
    const newContext = { ...currentContext }

    for (const key of keys) {
      delete newContext[key]
    }

    this.contextStack[this.contextStack.length - 1] = newContext
  }

  /**
   * コンテキスト付きで関数を実行
   * @param fn 実行する関数
   * @param context 付与するコンテキスト情報
   */
  async withContext<T>(fn: () => Promise<T>, context: LogContext): Promise<T> {
    // 新しいコンテキストレイヤーをスタックに追加
    this.contextStack.push(context)

    try {
      // 関数を実行
      return await fn()
    } finally {
      // コンテキストレイヤーを削除
      this.contextStack.pop()
    }
  }
}

/**
 * 現在のコンテキストに関連付けられたロガーインスタンスを取得する関数
 */
export const getLogger = (options?: LoggerOptions): Logger => {
  return AppLogger.getCurrentLogger(options || defaultLoggerOptions)
}
