/**
 * 環境変数の型定義
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * アプリケーションの実行環境
       * @see docs/adr/ADR002-app-stage-env.md
       */
      APP_STAGE: "development" | "staging" | "production" | "test"

      /**
       * Auth0関連の環境変数
       */
      AUTH0_DOMAIN?: string
      AUTH0_AUDIENCE?: string

      /**
       * 認証制御関連の環境変数
       */
      AUTH_EXCLUDE_PATHS?: string
    }
  }
}

export {}
