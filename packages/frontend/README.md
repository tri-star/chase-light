# Chase Light フロントエンド

GitHub リポジトリアクティビティトラッカー - フロントエンドアプリケーション

## 概要

Chase Light のフロントエンドアプリケーションです。Nuxt.js で構築されており、Auth0 と PostgreSQL を用いたサーバーサイド認証（セッション管理）を実装しています。

## 機能

- 🔒 **サーバーサイド認証**: Auth0 と PostgreSQL によるセッションストレージ
- 🎨 **モダンUI**: Tailwind CSS と Vue 3 Composition API
- 🔐 **保護されたルート**: ルート単位の認証ミドルウェア
- 🌐 **GitHub API 連携**: 安全なプロキシエンドポイント
- 📱 **レスポンシブデザイン**: モバイルファースト

## 前提条件

- Node.js 18+
- PostgreSQL データベース
- Auth0 アカウントとアプリケーション設定

## 環境設定

1. 環境ファイルをコピー:

```bash
cp .env.example .env
```

2. 以下の環境変数を設定:

```env
# Auth0 設定
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-api-identifier

# セッションシークレット（十分に長い乱数文字列を生成）
NUXT_SESSION_SECRET=your-very-long-random-session-secret-key-here

# データベース接続
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# アプリケーションURL
NUXT_PUBLIC_BASE_URL=http://localhost:3000

# 認証ログ（任意・デバッグ用途）
AUTH_LOG_LEVEL=info                # error/warn/info/debug
AUTH_DEBUG_SENSITIVE=false         # センシティブ情報のログ（開発のみ）
```

## インストール

依存関係をインストール:

```bash
pnpm install
```

## データベースセットアップ

1. PostgreSQL が起動していることを確認
2. `/database/init/` の SQL スクリプトを用いて DB とテーブルを作成
3. `.env` の `DATABASE_URL` を更新

## 開発サーバー

開発サーバーを `http://localhost:3000` で起動:

```bash
pnpm dev
```

## 認証フロー

1. **ログイン**: 認証のため Auth0 にリダイレクト
2. **コールバック**: Auth0 のコールバックで PostgreSQL にサーバーサイドセッションを作成
3. **セッション管理**: 暗号化クッキーでセッション状態を管理
4. **保護ルート**: ミドルウェアで保護ページのセッションを検証
5. **API アクセス**: 認証付きのプロキシ経由で GitHub API にアクセス

## 利用可能なページ

- `/` - 公開ホームページ
- `/dashboard` - 保護されたダッシュボード（要認証）
- `/profile` - 保護されたプロフィール（要認証）
- `/auth/login` - Auth0 ログインフローの開始
- `/auth/test-login` - テスト用ログインページ（開発限定）: 自動でセッションを作成しダッシュボードへ遷移

## API エンドポイント

### 認証系

- `GET /api/auth/callback` - Auth0 コールバック処理
- `POST /api/auth/logout` - ログアウトしてセッションを破棄
- `GET /api/auth/session` - 現在のセッション情報を取得

### 保護API

- `GET /api/protected/test` - 保護エンドポイントのテスト
- `GET /api/github/user` - GitHub ユーザー情報取得（プロキシ）
- `GET /api/github/repos` - GitHub リポジトリ一覧取得（プロキシ）

## アーキテクチャ

```
Frontend (Nuxt.js)
├── Server-side Authentication (Auth0)
├── PostgreSQL Session Storage
├── Protected Routes & Middleware
├── GitHub API Proxy Endpoints
└── Responsive UI Components
```

## セキュリティ機能

- サーバーサイドのセッション管理
- 暗号化クッキー（httpOnly, secure, sameSite）
- State パラメータによる CSRF 対策
- トークンの検証とリフレッシュ
- 期限切れセッションの自動クリーンアップ

## 本番運用

本番ビルドの作成:

```bash
pnpm build
```

本番ビルドのプレビュー:

```bash
pnpm preview
```

## ドキュメント

認証アーキテクチャの詳細は `/docs/adr/ADR001-auth.md` を参照してください。

フレームワークの詳細は [Nuxt ドキュメント](https://nuxt.com/docs/getting-started/introduction) を参照してください。
