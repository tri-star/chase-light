# ファイル命名規則（frontend）

本ドキュメントは `packages/frontend`（Nuxt 3）におけるファイル命名規則を定義します。既存実装とリポジトリ規約（kebab-case 推奨、Vue コンポーネントは PascalCase）を調和させています。

## 基本原則

- 文字: 英小文字・数字・ハイフン（`-`）を基本に使用（拡張子は慣例どおり）
- ファイル名: 原則として kebab-case (パーツとしてのVueコンポーネントは例外的にPascalCase)
- Vue コンポーネント名（タグ/クラス名）: PascalCase
- 型名（TypeScript）: PascalCase
- 変数・関数名: camelCase
- テスト: `*.test.ts`

## ディレクトリ別ルール

### components/

- ファイル: PascalCase `.vue`（例: `UserCard.vue`）
- 使用時: `<UserCard />` のように PascalCase で参照
- Storybook: `UserCard.stories.ts` または `UserCard.stories.mdx`（同ディレクトリに併設推奨）

### pages/

- ファイル: kebab-case `.vue`（例: `dashboard.vue`, `profile.vue`）
- ネスト: ディレクトリ名も kebab-case（例: `auth/login.vue`）
- 動的ルート: Nuxt 規約に従い `[id].vue`、キャッチオールは `[...slug].vue`

### composables/

- ファイル名: kebab-case（例: `use-auth.ts`, `use-dashboard-page.ts`）
- エクスポート: `export const useAuth = () => { ... }`（関数名は `use` + PascalCase）
- ページ専用のcomposableは `components/pages/<page>/use-<page>-page.ts` に併置
- 横断的に再利用するcomposableは `composables/use-xxx.ts` に配置

### middleware/

- ルートミドルウェア: kebab-case（例: `auth.ts`）
- グローバル適用: `auth.global.ts` のように `.global` サフィックス

### plugins/

- kebab-case（例: `dayjs.ts`）
- 実行環境の明示: `xxx.client.ts` / `xxx.server.ts`

### server/api/

- リソース単位ディレクトリ: kebab-case（例: `data-sources/`）
- Nuxt ルートファイル命名: `index.get.ts`, `index.post.ts`, `[id].get.ts` のように HTTP メソッドサフィックス
- 補助的ハンドラ: 予約/内部用途は先頭に `_` を付与可（例: `_test-login.post.ts`）

### server/utils/

- kebab-case（例: `auth0.ts`, `session.ts`）
- ブラウザからインポートしない前提のサーバ専用ユーティリティ

### generated/

- Orval 自動生成物。命名は生成ツールに従う（手動編集禁止）

### types/

- 型定義: kebab-case もしくは慣例的ファイル名（例: `env.d.ts`, `h3.d.ts`）

### utils/

- kebab-case（例: `validation.ts`）
- フレームワーク非依存の純関数を配置

### docs/

- ドキュメント: kebab-case（例: `file-naming-conventions.md`）

## テスト・ストーリーの命名

- Unit テスト: `*.spec.ts` または `*.test.ts`（対象コードの近傍配置を推奨）
- Storybook: `*.stories.ts(x)` または `*.stories.mdx`（コンポーネントと同ディレクトリ）

## 補足ルール

- 未使用引数・変数は `_` プレフィックスで意図的未使用として扱う（ESLint設定と整合）
- ファイルの役割が明確になる命名を優先（曖昧な省略は避ける）
- 自動生成物（`generated/`）やビルド成果物（`.nuxt/`, `.output/`）は命名/編集対象外
