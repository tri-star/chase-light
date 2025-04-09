/**
 * ロガーのエントリポイント
 * アプリケーション全体で使用可能なロガー関数を提供します
 */

import {
  AppLogger,
  defaultLoggerOptions,
  getLogger,
  loggerStorage,
} from './logger'
import type { Logger, LogContext, LogLevel, LoggerOptions } from './types'

// 型と関数をエクスポート
export type { Logger, LogContext, LogLevel, LoggerOptions }
export { getLogger, AppLogger, loggerStorage, defaultLoggerOptions }
