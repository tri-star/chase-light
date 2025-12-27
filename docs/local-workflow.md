# ローカル環境動作確認方法

## Auth0設定

以下のファイルに記述されたAuth0関連の環境変数を、Auth0ダッシュボードで発行した値に変更

- packages/backend/.env
- packages/frontenv/.env

## ポート番号調整

(複数環境起動させず、デフォルトポートを使う場合は不要)

以下のファイルに記述されたポート番号を、デフォルト以外の番号に変更

- packages/backend/.env
- packages/frontenv/.env

## Backendコンテナ起動

```bash
cd packages/backend
docker compose up -d
```

## マイグレーション実行

```bash
cd packages/backend
pnpm db:migrate
```

## backend APIサーバー起動

```bash
cd packages/backend
pnpm dev
```

## SAM Local, StepFunctionsLocalの起動

```bash
cd packages/backend
pnpm local:start
```

## pollerの起動(メッセージをポーリングしてLambdaを実行。SQS相当)

```bash
cd packages/backend
pnpm poller --queue process-updates-queue
```

## フロントエンドの開発サーバー起動

```bash
cd packages/frontend
pnpm dev
```

## 任意のGitHubユーザーでログイン

http://localhost:3000 にアクセスし、Auth0経由で任意のGitHubユーザーでログインします。
これで、usersテーブルにレコードが作成されます。

## データソースの登録

```bash
cd packages/backend
npx tsx scripts/create-data-source.ts https://github.com/zed-industries/zed
```

## StepFunctionステートマシンの実行

```bash
cd packages/backend

export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=ap-northeast-1

aws stepfunctions start-execution \
    --endpoint-url http://localhost:8083 \
    --state-machine-arn 'arn:aws:states:ap-northeast-1:123456789012:stateMachine:data-source-update-detection-local' \
    --input '{"sourceType": "github"}'
```

これで、activitiesテーブルにレコードが追加、翻訳処理が進むはずです。

## user_watchesテーブルでユーザーとデータソースを紐付け

DBクライアントなどを利用してuser_watchesテーブルにレコードをINSERTします。

## 通知作成の実行

```bash
cd packages/backend
cd infrastructure

export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=ap-northeast-1

sam local invoke --config-env dev GenerateDigestNotificationsFunction --event events/notification/generate-digest-notifications.json
```
