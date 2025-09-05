# フォルダ構成ガイドライン（frontend） — フォルダ構造に限定

## 目的とスコープ

`packages/frontend` の「フォルダ構造」を説明します。実装方法・命名規則・テスト手順などの詳細は本資料の対象外とし、必要に応じて関連ドキュメントを参照してください。

## 全体構成（抜粋）

```
packages/frontend
├── app.vue
├── .storybook/            # Storybook 設定
├── components/            # 再利用可能なUIコンポーネント
│   ├── assets/            # Storybook/Docs用の画像等
│   ├── base/              # 広く共通の最小UI（Cl* 接頭辞）
│   ├── common/            # 複数機能で再利用される中粒度UI
│   └── pages/             # ページ本体（UI）と parts / 専用 composable
│       └── <page>/
│           ├── parts/
│           ├── __tests__/
│           └── use-<page>-page.ts
├── composables/           # 横断的に再利用する composable
├── docs/
│   └── guidelines/
├── features/              # 機能（ドメイン）単位の整理
│   └── <feature>/
│       ├── models/
│       └── composables/
├── generated/             # Orval 自動生成コード（手動編集不可）
│   └── api/
├── layouts/               # Nuxt レイアウト（例: default, guest）
├── libs/                  # 外部ライブラリ連携の薄いラッパー
│   ├── context/
│   └── orval/
├── middleware/            # ルートミドルウェア
├── pages/                 # Nuxt ルーティング定義（薄いエントリ）
│   └── auth/
├── plugins/               # Nuxt プラグイン
├── public/                # 静的アセット
├── server/                # Nitroサーバ（BFF / サーバ専用ユーティリティ）
│   ├── api/
│   └── utils/
├── tests/                 # 近接配置しないテストをまとめる場合に使用
├── types/                 # グローバル型定義
├── utils/                 # フレームワーク非依存の純関数
├── .nuxt/                 # ビルド成果物（生成物）
└── .output/               # 本番ビルド出力（生成物）
```

## ディレクトリリファレンス（役割の要点のみ）

- `components/base/`: 広く共通の最小UI。接頭辞は `Cl*`（例: ClButton.vue）。
- `components/common/`: 複数機能で再利用される中粒度UI（例: AppHeader.vue）。
- `components/pages/<page>/`: ページ本体（`<PageName>Page.vue`）と `parts/`、ページ専用 composable（`use-<page>-page.ts`）を併置。
- `composables/`: 横断的に再利用する composable を配置。
- `features/<feature>/models`: 型、Zod スキーマ、型に特化した純関数（例: `user.ts`, `data-source.ts`）。
- `features/<feature>/composables`: 機能に特化した composable（例: `use-add-data-source.ts`）。
- `pages/`: Nuxt のルート定義（薄いエントリ）。UI 本体は `components/pages/<page>/` 側に置く運用。
- `layouts/`: Nuxt レイアウト（例: `default.vue`, `guest.vue`）。
- `middleware/`: ルーティング時の前処理。
- `plugins/`: ライブラリ初期化や provide/inject。
- `server/api/`: BFF 層のエンドポイント。
- `server/utils/`: サーバ専用ユーティリティ。
- `generated/`: Orval 生成物。手動編集不可。
- `libs/`: 外部ライブラリ連携の薄いラッパー。
- `types/`: グローバル型宣言（環境変数など）。
- `utils/`: 環境非依存の純関数ユーティリティ。
- `public/`: 静的ファイル（`/` 直下に配信）。
- `tests/`: 近接配置しない共通テストをまとめる場合に利用。

## 生成物とコミット対象外

- 生成物: `.nuxt/`, `.output/`, `generated/` は自動生成ディレクトリです。手動編集不可で、原則コミット対象外です。
- E2E 関連の生成物（例: `playwright-report/`, `test-results/`）もコミット不要です。

## 関連ドキュメント（詳細はこちら）

- ファイル命名規則: `packages/frontend/docs/guidelines/file-naming-conventions.md`
- コンポーネント実装ガイド: `packages/frontend/docs/guidelines/component-implementation-guide.md`
- ページ実装ガイド: `packages/frontend/docs/guidelines/page-implementation-guide.md`
- API 実装ガイド: `packages/frontend/docs/guidelines/api-implementation-guide.md`
- テスト戦略（MSW 含む）: `packages/frontend/docs/testing-strategy.md`

