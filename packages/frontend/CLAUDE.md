# Frontend プロジェクト開発ガイド（Nuxt 3）

このドキュメントは、Nuxt 3 + Vue 3 + Tailwind で構成されたフロントエンド（BFFを含む）の開発ガイドです。

## プロジェクト概要

- フレームワーク: Nuxt 3（SSR 有効） / Vue 3 Composition API
- スタイル: Tailwind CSS
- BFF: `server/api`（Nitro）で Backend をプロキシ
- 認証: Auth0 + PostgreSQL セッション（`server/utils`）
- API クライアント: Orval 生成物（`generated/api`）+ Zod スキーマ
- テスト: Vitest（Unit）/ Playwright（E2E）/ Storybook（UIドキュメント）

## 開発時に利用するコマンド

@packages/frontend/README.md 参照

## 開発ガイドライン

本プロジェクトでは、以下のガイドラインに従って開発を進めてください：

### 📁 フォルダ構成

- ドキュメント: [フォルダ構成ガイドライン](./docs/guidelines/folder-structure.md)
- ポイント:
  - 画面は `pages/`、共有 UI は `components/`、共有ロジックは `composables/` に配置
  - サーバ専用処理は `server/`（`api/` と `utils/`）へ集約（クッキー/DB/外部API）
  - 自動生成物は `generated/` 配下にまとめ、手動編集禁止

### 🚀 API 実装（BFF）

- ドキュメント: [API実装ガイド](./docs/guidelines/api-implementation-guide.md)
- 原則:
  - フロントからは必ず `/api`（BFF）を呼ぶ。クライアントから Backend を直叩きしない
  - Backend レスポンスは Zod でランタイム検証（`generated/api/zod/*`）
  - HTTP メソッド別に `index.get.ts` / `index.post.ts` として実装し、リソース単位にディレクトリを分割
  - 認証必須のルートは `requireUserSession` を使用
  - Orval の `mutator`（`libs/orval/custom-fetch.ts`）で共通ヘッダやバリデーションを適用

### 📝 ファイル命名規則

- ドキュメント: [ファイル命名規則](./docs/guidelines/file-naming-conventions.md)
- 概要:
  - 原則: ファイル名は kebab-case。Vue コンポーネント名は PascalCase
  - 例外: `composables` は既存実装に合わせて `useAuth.ts` のように `use` + CamelCase を許容
  - Nuxt 規約: `server/api/**/index.get.ts` など HTTP メソッドサフィックスを徹底

### 🧪 テスト戦略

- ドキュメント: [テスト戦略](./docs/testing-strategy.md)
- 概要:
  - Unit: Vitest を使用。テストは対象コードの近傍 or `tests/`
  - E2E: Playwright（`playwright/` 配下）。`pnpm --filter frontend test:e2e` で実行
  - API ルートは BFF として薄い整形が多いため、ページ/機能テストを優先

### コードスタイル / 設定

- フォーマット: Prettier（`.prettierrc`: semi: false, single quotes）
- Lint: ESLint（未使用変数は `_` プレフィックスで許容）
- TypeScript: 厳格モード、ビルド時型チェック（`nuxt.config.ts`）

## 継続的改善

### コードレビューチェックリスト

開発時は以下の項目を確認してください：

#### アーキテクチャ/構成

- [ ] [フォルダ構成](./docs/guidelines/folder-structure.md)に沿っているか
- [ ] 自動生成物（`generated/`）を手で編集していないか
- [ ] SSR/CSR の責務分離ができているか（サーバ処理を `server/` へ）

#### API（BFF）実装

- [ ] すべて `/api` 経由で Backend と通信しているか
- [ ] Zod によるレスポンス検証が行われているか
- [ ] エラーハンドリング/ステータスコードが妥当か
- [ ] 認証必須 API は `requireUserSession` を利用しているか

#### 画面/ロジック構成

- [ ] ページ固有ロジックは `pages/`、共有ロジックは `composables/` に分離されているか
- [ ] 認証が必要なページで `definePageMeta({ middleware: 'auth' })` を設定しているか

#### ファイル管理

- [ ] [ファイル命名規則](./docs/guidelines/file-naming-conventions.md)に従っているか

#### テスト

- [ ] [テスト戦略](./docs/testing-strategy.md)に沿ったテストがあるか
- [ ] 重要フローは E2E で担保されているか

#### 型安全性

- [ ] `any` の濫用がないか。型/ユーティリティを適切に定義しているか
- [ ] ランタイム境界（Backend との通信）で Zod 検証があるか
