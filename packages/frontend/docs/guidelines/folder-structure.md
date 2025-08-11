# フォルダ構成ガイドライン（frontend）

## 概要

`packages/frontend` は Nuxt 3 を用いたフロントエンドアプリケーションです。本ドキュメントは本パッケージの実体に沿ったフォルダ構成の標準を定義し、可読性・保守性・拡張性を高めることを目的とします。

## 全体構成（抜粋）

```
packages/frontend
├── app.vue
├── .storybook/            # Storybook 設定
├── components/            # 再利用可能なUIコンポーネント
│   └── assets/            # Storybook/Docs用の画像等
├── composables/           # Composition API関数（useXxx）
├── docs/
│   └── guidelines/
├── generated/             # Orval による自動生成コード
│   └── api/
├── libs/                  # ライブラリ連携や薄いラッパー
│   ├── context/
│   └── orval/
├── middleware/            # ルートミドルウェア（認証など）
├── pages/                 # ルーティング定義（Nuxt規約）
│   └── auth/
├── plugins/               # Nuxt プラグイン
├── public/                # 静的アセット（/ 直下に配信）
├── server/                # Nitroサーバ（BFF, サーバ専用ユーティリティ）
│   ├── api/               # BFFエンドポイント
│   │   ├── auth/
│   │   ├── data-sources/
│   │   └── protected/
│   └── utils/             # 認証/セッション等のサーバ専用処理
├── tests/                 # 単体テスト（Vitest）
├── types/                 # グローバル型定義（env等）
├── utils/                 # フロント専用ユーティリティ（純関数）
├── .nuxt/                 # ビルド成果物（自動生成）
└── .output/               # 本番ビルド出力（自動生成）
```

補足:

- `.nuxt/` と `.output/` と `generated/` は生成物です。手動編集は不可、基本的にコミット対象外です。
- `.env.example` を基に `.env` を作成してください（秘密情報のコミット禁止）。

## 主要ディレクトリの方針

### `components/`（UI コンポーネント）

- 役割: 再利用可能な表示・入出力コンポーネント。状態は最小化し、ページ固有のロジックは `pages/` や `composables/` 側。
- 命名: Vue コンポーネントは PascalCase。ファイル名は原則 kebab-case を推奨（リポジトリ規約）。
- ドキュメント: Storybook を利用。`.stories.@(ts|tsx|mdx)` を併設可。画像等は `components/assets/`。
- テスト: 可能なら近接配置 `*.test.ts`。

### `composables/`（Composition API）

- 役割: `useXxx` 形式のロジック共有（例: `useAuth.ts`）。SSR/CSR の差異に注意して実装（`import.meta.client/server`）。
- 責務: UI と分離し、副作用は明示。サーバに依存する処理は `server/` に逃がす。

### `pages/`（ページ/ルーティング）

- 役割: ルートに紐づくページコンポーネント（例: `dashboard.vue`, `profile.vue`, `auth/login.vue`）。
- 認証: 認証が必要なページはページメタでミドルウェアを指定。

  ```ts
  definePageMeta({ middleware: 'auth' })
  ```

- データ取得: CSR では `useFetch`/`useAsyncData` を用いて重複排除を活用。サーバ連携は `/api` 経由（BFF）。

### `middleware/`（ルートミドルウェア）

- 役割: ルーティング時の前処理。`auth.ts` は SSR/CSR 両方でセッションを確認し未ログインなら `/auth/login` へ遷移。
- 種別: グローバル化が必要な場合は `*.global.ts`、ページ単位適用は `definePageMeta` で指定。

### `plugins/`

- 役割: ライブラリ初期化や `provide/inject`。クライアント限定/サーバ限定はファイル名サフィックス（`.client`, `.server`）。

### `server/`（Nitro: BFF とサーバ専用ユーティリティ）

- `server/api/`: BFF 層。フロントからは `/api/*` を呼び出し、ここから Backend API を叩く。
  - 構成例: `auth/`, `data-sources/`, `protected/` などリソース単位でディレクトリを切り、`index.get.ts`, `index.post.ts` のように HTTP メソッドでファイルを分割。
  - 検証: 境界を跨ぐレスポンスは Zod でランタイム検証（`generated/api/zod/*`）。
  - 認証: `requireUserSession` でセッション強制。Auth0 コールバック/ログアウトは `auth/` 配下。
- `server/utils/`: サーバ専用のユーティリティ（例: `auth0.ts`, `session.ts`）。クッキーやDB(PostgreSQL)を扱うためクライアントから参照しない。

### `generated/`（Orval 生成物）

- 役割: OpenAPI から生成された API クライアントと Zod スキーマ。
- 運用: 手動編集禁止。`pnpm generate:api`（`predev`/`prebuild`で自動）で更新。
- カスタムフェッチ: `libs/orval/custom-fetch.ts` を `mutator` として利用し、必要に応じて Authorization を付与。

### `libs/`

- 役割: 外部ライブラリ連携の薄いラッパー配置場所（例: Orval 用フェッチ）。アプリ固有ドメインロジックは置かない。

### `types/`

- 役割: グローバル型宣言（`env.d.ts`, `h3.d.ts` など）。環境変数の型安全性を担保。

### `utils/`

- 役割: 環境非依存の純関数ユーティリティ（例: `validation.ts`）。Vue/Nuxt 依存ロジックは `composables/` へ。

### `public/`

- 役割: 静的ファイル（`/` 直下に配信）。ファビコンや静的画像等。

### `docs/`

- 役割: フロントエンドに関するガイドライン/設計ドキュメント。API 実装方針は `guidelines/api-implementation-guide.md` を参照。

### `tests/` と E2E

- 単体テスト: Vitest（`pnpm --filter frontend test`）。テストは近接配置 or `tests/` にまとめる。
- E2E: Playwright（`packages/frontend/playwright/`）。`pnpm --filter frontend test:e2e` で実行。
- 生成物: `playwright-report/`, `test-results/` は生成物。コミット不要。

## 命名・配置規約（再掲）

- 言語: TypeScript。インデント2スペース、LF。
- フォーマット: Prettier（`.prettierrc`: semi: false, single quotes）。
- ESLint: 未使用変数は `_` プレフィックスで許容。
- ファイル命名: kebab-case を推奨。Vue コンポーネント名は PascalCase、関数/変数は camelCase、型は PascalCase。
- API 呼び出し: 直接 Backend を叩かず、必ず `server/api`（BFF）経由。レスポンスは Zod で検証。

## よくある配置の判断基準

- Vue ランタイムに依存しない処理 → `utils/`
- Vue/Nuxt に依存する共有ロジック → `composables/`
- ページ固有の表示/ロジック → `pages/`
- 再利用 UI → `components/`
- サーバ専用（Cookie/DB/外部認証） → `server/utils/` または `server/api/`
- 外部APIクライアント/スキーマ → `generated/`（自動生成、手動編集禁止）

## 参考

- API 実装ガイドライン: `packages/frontend/docs/guidelines/api-implementation-guide.md`
- Nuxt 公式ドキュメント: https://nuxt.com/docs
