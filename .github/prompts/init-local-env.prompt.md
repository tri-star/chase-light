---
name: init-local-env
description: ローカル環境の初期化
agent: agent
model: GPT-5 mini
---

# 概要

ローカル環境を初期化するために以下の作業を実施してください。

- 1. ポート番号インデックスの決定
- 2. pnpm install
- 3. packages/backendの初期化
- 4. packages/frontendの初期化

## 1. ポート番号インデックスの決定

ローカル環境は複数のポートを扱いますが、Git worktreeを使う場合など、ローカル環境自体を複数起動するシーンが想定されます。
このため、環境間でポートが衝突しないよう、ポート番号インデックスを決定する必要があります。

ポート番号インデックスは0, 100, 200などの100単位の数値で、ユーザーから入力により渡される想定です。

今回のポート番号インデックス： ${input:portIndex:ポート番号インデックス}

ユーザーから入力が与えられていない場合、質問して指示を求めてください。

## 2. pnpm install

プロジェクトルートで以下を実行します。

```bash
pnpm install
```

## 3. packages/backendの初期化

### 3-1. .envの作成

最初に以下のコマンドを実行して .envファイルのひな形を作成します。

```bash
cd packages/backend
cp .env.example .env
```

次に、 .envファイルを以下のように編集します。

- COMPOSE_PROJECT_NAME: ブランチ名やプロジェクトルートのフォルダ名からユニークな名前を決定し- ます。 kebab-caseで、`backend-<プロジェクト名>` とします。
- PORT: デフォルト値 + ポート番号インデックス
- DB_PORT: デフォルト値 + ポート番号インデックス
- ELASTICMQ_PORT: デフォルト値 + ポート番号インデックス
- ELASTICMQ_UI_PORT: デフォルト値 + ポート番号インデックス
- STEPFUNCTIONS_PORT: デフォルト値 + ポート番号インデックス
- SAM_LOCAL_PORT: デフォルト値 + ポート番号インデックス
- FRONTEND_URL: http://localhost:<デフォルト値 + ポート番号インデックス>
- AUTH0_DOMAIN: dummy # (固定値)
- AUTH0_AUDIENCE: dummy # (固定値)
- AUTH0_APP_AUDIENCE: dummy # (固定値)

**IMPORTANT**: 上記以外の変数にもポート番号が含まれることがありますが、それらは変更不要です。
(Audienceの値は固定値が想定されており、変更すると正しく動作しなくなる懸念があります)

### 3-2. docker compose初期化

以下のコマンドを実行してdocker composeを初期化します。

```bash
# packages/backendディレクトリで実行
docker compose up -d
```

### 3-3. DBマイグレーション実行

以下のコマンドを実行してDBマイグレーションを実行します。

```bash
# packages/backendディレクトリで実行
pnpm db:migrate
```

## 4. packages/frontendの初期化

### 4-1. .envの作成

最初に以下のコマンドを実行して .envファイルのひな形を作成します。

```bash
cd ../frontend
cp .env.example .env
```

次に、 .envファイルを以下のように編集します。

- DATABASE_URL: postgresql://postgres:password@localhost:<デフォルト値+ポート番号インデックス>/chase_light
- NUXT_PUBLIC_BASE_URL: http://localhost:<デフォルト値+ポート番号インデックス>
- BACKEND_API_URL: http://localhost:<デフォルト値+ポート番号インデックス>
- FRONTEND_PORT: <デフォルト値+ポート番号インデックス>

**IMPORTANT**: 上記以外の変数にもポート番号が含まれることがありますが、それらは変更不要です。
(Audienceの値は固定値が想定されており、変更すると正しく動作しなくなる懸念があります)
