# Chase Light API - SAM Deployment

Chase Light APIのServerless Framework v4からSAMへの移行プロジェクトです。段階的な移行を行い、現在はAPI Gatewayと一部のLambda関数の移行を実装しています。

## プロジェクト概要

このプロジェクトには以下のファイルとフォルダが含まれています：

- `template.yaml` - アプリケーションのAWSリソースを定義するSAMテンプレート
- `samconfig.toml` - 環境別のデプロイ設定
- `package.json` - ビルドとデプロイのスクリプト
- `../../api/src/handlers/api-gateway/user/` - User Lambda関数のソースコード（既存のapiパッケージを参照）

## リソース命名規則

リソース名は以下の規則に従います：

```
chase-light-[ステージ名]-api-[リソース名]
```

例：

- スタック名: `chase-light-dev-api-stack`
- API Gateway: `chase-light-dev-api-gateway`
- Lambda関数: `chase-light-dev-api-user-handler`
- SQSキュー: `chase-light-dev-api-feed-analyze-queue`

## 必要なツール

SAM CLIを使用するために以下のツールが必要です：

- SAM CLI - [SAM CLIのインストール](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [Node.js 20のインストール](https://nodejs.org/en/)
- Docker - [Docker community editionのインストール](https://hub.docker.com/search/?type=edition&offering=community)

## 環境別デプロイ

環境ごとに異なる設定でデプロイできます：

### Local環境

```bash
npm run deploy:local
```

### Development環境

```bash
npm run deploy:dev
```

### Staging環境

```bash
npm run deploy:staging
```

### Production環境

```bash
npm run deploy:prod
```

## 初回デプロイ手順

1. 依存関係のインストール：

```bash
npm install
```

2. アプリケーションのビルド：

```bash
npm run build
```

3. 環境に応じたデプロイ：

```bash
npm run deploy:dev
```

## ローカル開発

### APIをローカルで起動

```bash
npm run start:local
```

APIは `http://localhost:3001` で利用できます。

### Lambda関数を個別にテスト

```bash
sam local invoke UserFunction --event events/user-event.json
```

## 利用可能なコマンド

```bash
# ビルド
npm run build
npm run build:watch

# デプロイ（環境別）
npm run deploy:local
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# ローカル実行
npm run start:local
npm run start:lambda

# ログ確認
npm run logs:user

# 削除（環境別）
npm run delete:local
npm run delete:dev
npm run delete:staging
npm run delete:prod

# バリデーション
npm run validate
```

## 環境変数

以下の環境変数とパラメータが設定されます：

- `STAGE` - デプロイステージ名
- `DATABASE_URL` - Supabaseデータベース接続URL（Secrets Managerから取得）
- `OPENAI_API_KEY` - OpenAI APIキー（Secrets Managerから取得）
- `AUTH0_DOMAIN` - Auth0ドメイン
- `API_URL` - API URL
- `ANALYZE_FEED_LOG_QUEUE_URL` - Feed分析用SQSキューURL

## 移行状況

### 完了済み

- ✅ API Gateway設定
- ✅ User Lambda関数
- ✅ SQSキュー（Feed分析用）
- ✅ 環境別デプロイ設定
- ✅ リソース命名規則の適用

### 今後の予定

- 🔄 Feed Lambda関数の移行
- 🔄 Notification Lambda関数の移行
- 🔄 Step Functions（Feed Analyzer）の移行
- 🔄 その他のハンドラーの移行

## トラブルシューティング

### ログの確認

```bash
# User関数のログを確認
npm run logs:user

# 特定の関数のログをリアルタイムで確認
sam logs --name UserFunction --stack-name chase-light-dev-api-stack --tail
```

### デプロイの削除

不要になったスタックを削除する場合：

```bash
npm run delete:dev
```

## 参考資料

- [AWS SAM開発者ガイド](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html)
