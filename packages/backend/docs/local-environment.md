# ローカル環境構築ガイド

## 概要

Chase Light Backendのローカル開発環境セットアップガイドです。

## 前提条件

- Docker & Docker Compose
- Node.js 20+
- pnpm

## 環境構築手順

### 1. 依存関係のインストール

```bash
# プロジェクトルートで実行
pnpm install
```

### 2. 環境変数の設定

```bash
# backend用の環境変数をコピー
# 環境に応じて値を設定
cp .env.example .env
```

### 4. データベースの起動

```bash
# プロジェクトルートで実行
docker compose up -d db

# データベースの起動確認
docker compose ps
```

データベース起動時に以下が自動で作成されます：

- `chase_light` - 開発用データベース
- `chase_light_test` - テスト用データベース

### 5. データベースマイグレーション

```bash
# マイグレーションの実行
pnpm db:migrate
```

### 6. 開発サーバーの起動

```bash
# Backend開発サーバー起動
pnpm dev

```

## テスト環境

### テスト用データベースのセットアップ

```bash
# npmスクリプト使用
pnpm test:setup
```

### テストの実行

```bash
# 全テスト実行
pnpm test

# テスト監視モード
pnpm test:watch

# 特定のフォルダだけ
pnpm test src/features/user/presentation/__tests__/
pnpm test src/features/user/services/__tests__/
```

## 開発ツール

### データベース管理

```bash
# Drizzle Studio（GUI）
pnpm db:studio

# データベース接続テスト
pnpm db:test
```

### リント・フォーマット

```bash
# リント実行
pnpm lint

# 型チェック
pnpm lint:type

# フォーマット
pnpm format
```

## トラブルシューティング

### データベース関連

#### テスト用DBが見つからない場合

```bash
# コンテナを再起動（初期化スクリプトが再実行される）
docker compose down
docker compose up -d db

# または手動でセットアップ
cd packages/backend
pnpm test:setup
```

#### 権限エラーが発生する場合

```bash
# PostgreSQLコンテナに接続して権限確認
docker exec -it $(docker ps -q -f "name=postgres") psql -U postgres -d chase_light_test

# 権限の再設定
GRANT ALL PRIVILEGES ON DATABASE chase_light_test TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
```

#### マイグレーションエラー

```bash
# マイグレーションファイルを削除してリセット
rm -rf drizzle/

# スキーマを再生成
pnpm db:generate

# データベースにpush（開発中）
pnpm db:push
```

### テスト関連

#### テストが失敗する場合

```bash
# テスト用環境変数の確認
cat .env.testing

# データベース接続の確認
NODE_ENV=test pnpm db:test

# テスト用DBの手動リセット
docker exec -it $(docker ps -q -f "name=postgres") psql -U postgres -d chase_light_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

#### 依存関係エラー

```bash
# node_modulesをクリーンインストール
rm -rf node_modules
pnpm install

# 型定義の再インストール
pnpm add -D @types/node @types/pg
```

## 便利なコマンド

```bash
# 全体のビルド（プロジェクトルート）
pnpm build

# 特定パッケージのみ実行
pnpm --filter backend dev
pnpm --filter frontend dev

# ログの確認
docker compose logs db
docker compose logs -f db  # リアルタイム表示
```

## 参考リンク

- [開発コマンド一覧](./.github/instructions/dev_commands.instructions.md)
- [アーキテクチャガイド](./docs/guidelines/architecture-patterns.md)
- [テスト戦略](./docs/guidelines/testing-strategy.md)
