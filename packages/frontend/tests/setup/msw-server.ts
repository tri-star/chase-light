import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'

/**
 * MSW (Mock Service Worker) サーバーのセットアップ
 *
 * このサーバーはテスト実行時にHTTPリクエストをインターセプトし、
 * モックレスポンスを返すために使用されます。
 */
export const server = setupServer()

// テストスイート開始前にサーバーを起動
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// 各テスト後にハンドラーをリセット
afterEach(() => {
  server.resetHandlers()
})

// テストスイート終了後にサーバーを停止
afterAll(() => {
  server.close()
})
