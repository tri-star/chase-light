import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { AppLogger, getLogger } from '@/lib/logger'
import { createMiddleware } from 'hono/factory'
import { v4 as uuidv4 } from 'uuid'

/**
 * リクエスト情報をログコンテキストに追加するミドルウェア
 *
 * 各リクエストに一意のリクエストIDを付与し、以下の情報をコンテキストに追加します：
 * - requestId: リクエスト識別子
 * - method: HTTPメソッド
 * - path: リクエストパス
 * - userAgent: ユーザーエージェント
 */
export const loggerMiddleware = createMiddleware<AppContext>(
  async (c, next) => {
    // リクエストIDの取得 (優先順位: x-amzn-requestid > x-request-id > 新規生成)
    const requestId =
      c.req.header('x-amzn-requestid') ||
      c.req.header('x-request-id') ||
      `unknown-${uuidv4()}`

    // トレースIDがあれば取得 (X-Ray)
    const traceId = c.req.header('x-amzn-trace-id') || 'unknown'

    const method = c.req.method
    const path = c.req.path
    const userAgent = c.req.header('user-agent') || 'unknown'
    const ip = c.req.header('x-forwarded-for') || 'unknown'

    // リクエストごとに新しいロガーインスタンスをAsyncLocalStorageに格納して実行
    return AppLogger.runWithNewLogger(
      async () => {
        // 現在のリクエスト用のロガーにコンテキスト情報を追加
        getLogger().addContext({
          requestId,
          traceId,
          method,
          path,
          userAgent,
          ip,
        })

        // リクエスト開始のログを出力
        getLogger().info(`Request started: ${method} ${path}`)

        const startTime = performance.now()

        try {
          // 次のミドルウェアを実行
          await next()

          // リクエスト完了時の処理
          const endTime = performance.now()
          const responseTime = Math.round(endTime - startTime)
          const status = c.res?.status || 200

          getLogger().info(`Request completed: ${method} ${path}`, {
            status,
            responseTime,
          })
        } catch (error) {
          // エラー発生時の処理
          const endTime = performance.now()
          const responseTime = Math.round(endTime - startTime)

          getLogger().error(
            `Request failed: ${method} ${path}`,
            {
              responseTime,
            },
            error instanceof Error ? error : new Error('Unknown error'),
          )

          // エラーを再スロー
          throw error
        }
      },
      // ロガーオプション（環境に応じたログレベル設定）
      { minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
    )
  },
)
