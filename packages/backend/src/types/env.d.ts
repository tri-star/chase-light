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
      APP_STAGE: "dev" | "stg" | "prod" | "test"

      /**
       * Auth0関連の環境変数
       */
      AUTH0_DOMAIN?: string
      AUTH0_AUDIENCE?: string
      AUTH0_APP_AUDIENCE?: string

      /**
       * 認証制御関連の環境変数
       */
      AUTH_EXCLUDE_PATHS?: string

      /**
       * テスト用Auth設定
       */
      TEST_AUTH_ENABLED?: "true" | "false"
      TEST_AUTH_SECRET?: string
      TEST_AUTH_AUDIENCE?: string
      TEST_AUTH_ISSUER?: string

      /**
       * 外部AI API呼び出しをスタブに切り替えるかどうか
       * 開発・テスト用途のみ true を設定
       */
      USE_EXTERNAL_AI_API_STUB?: "true" | "false"
    }
  }
}

export {}
