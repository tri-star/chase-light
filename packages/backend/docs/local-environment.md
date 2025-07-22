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

## StepFunctions Local セットアップ

StepFunctions Local を利用することで、リポジトリ監視などのバッチ処理をローカルで実行、テストできます。

### 1. 開発環境起動

StepFunctions Local を含んだ開発環境を起動します。

```bash
# 統合開発環境を起動
./scripts/start-local-dev.sh

# バックグラウンドで起動する場合（ターミナルを閉じても継続）
./scripts/start-local-dev.sh --wait &
```

起動が完了すると、以下のようなメッセージが表示されます：

```
=== 開発環境の起動が完了しました ===

サービス一覧:
  - PostgreSQL: localhost:5432
  - StepFunctions Local: http://localhost:8083
  - SAM Local: http://localhost:3001

停止する場合は以下を実行してください:
  ./scripts/stop-local-dev.sh
```

### 2. サービス動作確認

```bash
# PostgreSQL接続確認
docker compose exec db pg_isready -U postgres -d chase_light

# StepFunctions Local確認
curl -f http://localhost:8083/

# SAM Local確認
curl -f http://localhost:3001/2015-03-31/functions/list-datasources/invocations
```

### 3. StepFunctions実行

#### ステートマシン作成

```bash

# StepFunctionsLocalが作成するStateMachineは常にus-east-1
export AWS_REGION=us-east-1

# 必要に応じて実行
# export AWS_PROFILE=xxx
# aws sso login

# StepFunctions LocalでステートマシンをLaunch
aws stepfunctions create-state-machine \
  --endpoint-url http://localhost:8083 \
  --name "repository-monitoring-local" \
  --definition file://infrastructure/repository-monitoring.asl.json \
  --role-arn arn:aws:iam::123456789012:role/DummyRole
```

#### ワークフロー実行

```bash
# ステートマシン実行
# ** StepFunctionsLocalが作成するStateMachineは常にus-east-1 **
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local \
  --input '{"sourceType": "github_repository"}'
```

### 4. MockConfigを使用したテスト

Step Functions Localでは、実際のLambda関数を実行せずにモックレスポンスを使用してテストできます。
これにより高速で安定したテストが可能になります。

#### 利用可能なテストケース

以下の3つのテストケースが`infrastructure/MockConfigFile.json`で定義されています：

1. **HappyPathTest**: 正常系テスト（複数のデータソースを返す）
2. **ErrorPathTest**: エラー系テスト（データベース接続エラーをシミュレート）
3. **EmptyResultTest**: 空結果テスト（データソースが存在しない場合）

#### 各テストケースの実行

```bash
# 1. HappyPathTest（正常系）
aws stepfunctions start-execution \
  --endpoint http://localhost:8083 \
  --name happyPathTestExecution \
  --state-machine "arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local#HappyPathTest" \
  --input '{}'

# 2. ErrorPathTest（エラー系）
aws stepfunctions start-execution \
  --endpoint http://localhost:8083 \
  --name errorPathTestExecution \
  --state-machine "arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local#ErrorPathTest" \
  --input '{}'

# 3. EmptyResultTest（空結果）
aws stepfunctions start-execution \
  --endpoint http://localhost:8083 \
  --name emptyResultTestExecution \
  --state-machine "arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local#EmptyResultTest" \
  --input '{}'
```

#### 実行結果の確認

```bash
# 実行履歴を確認
aws stepfunctions get-execution-history \
  --endpoint http://localhost:8083 \
  --execution-arn <実行結果のexecutionArnを指定>

# 実行結果のPayloadを確認（HappyPathTestの場合）
aws stepfunctions get-execution-history \
  --endpoint http://localhost:8083 \
  --execution-arn <実行結果のexecutionArn> \
  --query 'events[?type==`TaskSucceeded`].taskSucceededEventDetails.output' \
  --output text
```

#### 一括テスト実行

全てのテストケースを一度に実行する場合は、以下のスクリプトを使用してください：

```bash
# 全テストケースを実行
./scripts/test-stepfunctions-local.sh

# 特定のテストケースのみ実行
./scripts/test-stepfunctions-local.sh HappyPathTest
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
