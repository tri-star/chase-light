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

### 1. 統合開発環境起動（推奨）

新しい統合セットアップスクリプトを使用して、全ての必要なサービスを一括で起動できます。

```bash
# 統合開発環境を起動
pnpm local:start

# または直接実行
node scripts/setup-local-environment.mjs

# クリーンモード（既存のコンテナとボリュームを削除してから起動）
pnpm local:start --clean

# 起動後、フォアグラウンドで待機（Ctrl+Cで停止）
pnpm local:start --wait
```

起動が完了すると、以下のようなメッセージが表示されます：

```
=== セットアップ完了 ===

サービス一覧:
  - PostgreSQL: localhost:5432
  - StepFunctions Local: http://localhost:8083
  - SAM Local: http://localhost:3001
  - ElasticMQ Web UI: http://localhost:9325

ステートマシンARN: arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local

停止する場合は以下を実行してください:
  pnpm local:stop
  または Ctrl+C で停止できます
```

## 環境の停止

開発環境を停止するには、以下のコマンドを実行します：

```bash
pnpm local:stop

# または直接実行
node scripts/stop-local-environment.mjs
```

### 3. サービス動作確認

```bash
# PostgreSQL接続確認
docker compose exec db pg_isready -U postgres -d chase_light

# StepFunctions Local確認
curl -f http://localhost:8083/

# SAM Local確認
curl -f http://localhost:3001/2015-03-31/functions/list-detect-targets/invocations
```

### 4. StepFunctions実行

統合セットアップスクリプトによって、ステートマシンは自動的に作成されます。

#### ワークフロー実行

用意されている入力データサンプルを使用してワークフローを実行できます：

```bash
# 基本的な実行
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:ap-northeast-1:123456789012:stateMachine:data-source-update-detection-local \
  --input file://infrastructure/events/repository-monitoring-basic.json

# テストモードでの実行
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:ap-northeast-1:123456789012:stateMachine:data-source-update-detection-local \
  --input file://infrastructure/events/repository-monitoring-test.json

# 直接JSON指定での実行
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:ap-northeast-1:123456789012:stateMachine:data-source-update-detection-local \
  --input '{"sourceType": "github"}'
```

利用可能な入力データサンプルについては、`infrastructure/events/README.md` を参照してください。

#### 実行結果の確認

```bash
# 実行一覧の確認
aws stepfunctions list-executions \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:ap-northeast-1:123456789012:stateMachine:data-source-update-detection-local

# 実行履歴の詳細確認
aws stepfunctions get-execution-history \
  --endpoint-url http://localhost:8083 \
  --execution-arn <実行結果のexecutionArnを指定>

# SQSキューメッセージの確認
aws --region us-east-1 --endpoint-url http://localhost:9324 \
  sqs receive-message \
  --queue-url http://localhost:9324/000000000000/process-updates-queue
```

### 5. MockConfigを使用したテスト

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
