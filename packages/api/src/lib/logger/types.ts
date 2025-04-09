/**
 * ロガーの型定義
 */

/**
 * ログレベル
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * ログコンテキスト
 * ログに付与する追加情報のオブジェクト型
 */
export type LogContext = Record<string, unknown>

/**
 * ロガーインターフェース
 */
export interface Logger {
  /**
   * デバッグレベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報 (オプション)
   */
  debug(message: string, context?: LogContext): void

  /**
   * 情報レベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報 (オプション)
   */
  info(message: string, context?: LogContext): void

  /**
   * 警告レベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報 (オプション)
   */
  warn(message: string, context?: LogContext): void

  /**
   * エラーレベルのログを出力
   * @param message ログメッセージ
   * @param context 追加コンテキスト情報 (オプション)
   */
  error(message: string, context?: LogContext, error?: Error): void

  /**
   * コンテキストを追加
   * 以降の全てのログに指定したコンテキスト情報が付与される
   * @param context 追加するコンテキスト情報
   */
  addContext(context: LogContext): void

  /**
   * コンテキストを削除
   * 指定したキーのコンテキスト情報を削除する
   * @param keys 削除するキー名の配列
   */
  removeContext(keys: string[]): void

  /**
   * コンテキスト付きで関数を実行
   * 関数内のログに指定したコンテキスト情報が付与される
   * @param fn 実行する関数
   * @param context 付与するコンテキスト情報
   */
  withContext<T>(fn: () => Promise<T>, context: LogContext): Promise<T>
}

/**
 * ログ出力設定
 */
export interface LoggerOptions {
  /**
   * 最小ログレベル（これ以上のレベルのログのみ出力される）
   */
  minLevel?: LogLevel
}
