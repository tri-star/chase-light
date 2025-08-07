/**
 * 環境変数の型定義
 *
 * このファイルは、TypeScriptでprocess.envの型補完を有効にするためのものです。
 * 実際のコードで使用されている環境変数を定義しています。
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node.js環境
      NODE_ENV: 'development' | 'production' | 'test'

      // Auth0設定（nuxt.config.tsで使用）
      AUTH0_DOMAIN: string
      AUTH0_CLIENT_ID: string
      AUTH0_CLIENT_SECRET: string
      AUTH0_AUDIENCE: string

      // セッション設定（nuxt.config.tsで使用）
      NUXT_SESSION_SECRET: string

      // データベース設定（nuxt.config.tsで使用）
      DATABASE_URL: string

      // アプリケーション設定（nuxt.config.tsで使用）
      NUXT_PUBLIC_BASE_URL?: string

      // 認証ログ設定（server/utils/auth0.tsで使用）
      AUTH_LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug'
      AUTH_DEBUG_SENSITIVE?: 'true' | 'false'

      // アプリケーションステージ（その他のファイルで使用される可能性）
      APP_STAGE?: string
    }
  }
}

// このファイルをモジュールとして認識させるための空のexport
export {}
