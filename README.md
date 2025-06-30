# Chase Light

Chase Lightは、あなたがGitHubでウォッチしているリポジトリの最新動向を逃さずキャッチするためのインテリジェントな通知サービスです。新しいリリース、プルリクエスト、Issueの更新など、無数の情報の中からAIが「本当に重要な変更」だけをフィルタリングし、日本語で要約してお届けします。

## ✨ 主な機能 (Core Features)

- **自動インポート**: GitHubでウォッチしているリポジトリを自動で取り込みます。
- **手動追加**: ウォッチしていないリポジトリも手動で監視対象に追加できます。
- **イベント通知**: リリース、PR、Issueの作成・更新イベントを通知します。
- **AIフィルタリング**: 自然言語で設定した興味・関心に基づき、通知をパーソナライズします。
- **ブックマーク**: 気になったイベント（リリース、PR、Issue）を保存し、後で確認できます。
- **トレンド表示**: 多くのユーザーが注目しているイベントを一覧で確認できます。

## 🛠️ 技術スタック (Tech Stack)

本プロジェクトは、以下の技術スタックで構築されています。

| カテゴリ           | 技術                                                               |
| ------------------ | ------------------------------------------------------------------ |
| **共通**           | TypeScript, pnpm, Biome                                            |
| **フロントエンド** | Nuxt.js, Vue, Tailwind CSS, Storybook                              |
| **バックエンド**   | Hono, Drizzle ORM, Zod, PostgreSQL                                 |
| **テスト**         | Vitest, Playwright                                                 |
| **インフラ**       | AWS (Lambda, API Gateway, SQS, StepFunctions), Docker, Supabase DB |
| **CI/CD**          | GitHub Actions                                                     |
| **認証**           | Auth0                                                              |

## 🚀 環境構築

[クイックスタート](./docs/quickstart.md) 参照

## 🌐 ローカル環境

- **フロントエンド**: `http://localhost:3000`
- **バックエンドAPI Swagger(JSON)**: `http://localhost:3001/doc`
- **バックエンドAPI ドキュメント**: `http://localhost:3001/scalar`

## 📁 ディレクトリ構成

このプロジェクトはpnpmワークスペースを利用したモノレポ構成です。

```
.
├── packages/
│   ├── backend/   # Hono + Drizzle ORMによるバックエンドAPI
│   ├── frontend/  # Nuxt.jsによるフロントエンドアプリケーション
│   └── shared/    # 複数パッケージで共有されるコード
└── docs/          # 設計ドキュメント (ADRなど)
```

## 📚 ドキュメント

より詳細な設計方針や決定事項については、以下のドキュメントを参照してください。

- [ADR (Architecture Decision Records)](./docs/adr/)
- [データベーススキーマ設計](./docs/database-schema-design.md)
