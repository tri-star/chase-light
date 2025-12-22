# Frontend SAM template (CHASE-180)

Nuxt 3 を AWS Lambda + HTTP API で動かすための SAM テンプレートです。`pnpm build` を AWS Lambda 向けプリセットで実行した成果物（`.output/server` と `.output/public`）をそのままデプロイする前提になっています。

## 前提ツール
- AWS CLI v2（`aws sts get-caller-identity` で認証済みであること）
- AWS SAM CLI v1.120+（`sam --version`）
- pnpm（ルートで依存関係をインストール済み）

## ディレクトリ構成
- `template.yaml` … SAM テンプレート
- `samconfig.toml` … dev/prod 用の deploy 設定テンプレート（Secret ARN は置き換えてください）
- `.gitignore` … `.aws-sam` などのローカル生成物を除外

## 必要なシークレット
Secrets Manager に JSON で格納し、ARN を `SecretId` パラメータに渡します。

```json
{
  "NODE_ENV": "production",
  "AUTH0_DOMAIN": "example.us.auth0.com",
  "AUTH0_CLIENT_ID": "xxxxx",
  "AUTH0_CLIENT_SECRET": "xxxxx",
  "AUTH0_AUDIENCE": "https://example/api",
  "NUXT_SESSION_SECRET": "random-string",
  "DATABASE_URL": "postgresql://...",
  "BACKEND_API_URL": "https://example-backend-api"
}
```

## ビルド & デプロイ手順（ローカル）
1. Lambda 用にビルド  
   ```bash
   cd packages/frontend
   NITRO_PRESET=aws-lambda pnpm build
   ```
   - `.output/server/index.mjs` に `handler` がエクスポートされ、`node_modules` も展開されます。
   - 静的アセットは `.output/public` に生成されます。

2. SAM ビルド  
   ```bash
   cd packages/frontend/infrastructure
   sam build -t template.yaml
   ```

3. デプロイ（例: dev）  
   `samconfig.toml` の `SecretId` を事前に埋めた上で:
   ```bash
   sam deploy --config-env dev
   ```
   prod の場合は `--config-env prod`。

4. 静的アセットを S3 へ同期  
   - バケット名は `<stage>-chase-light-app-assets` を推奨（テンプレートのデフォルトは dev 用）。  
   ```bash
   aws s3 sync ../.output/public s3://<AssetsBucketName>/
   ```

## GitHub Actions でのデプロイ例（抜粋）
リポジトリに保存する際は AWS 認証情報を OIDC などで安全に渡してください。

```yaml
name: deploy-frontend
on:
  workflow_dispatch:
    inputs:
      env:
        type: choice
        options: [dev, prod]
        default: dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      NITRO_PRESET: aws-lambda
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ap-northeast-1
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
      - run: sam build -t packages/frontend/infrastructure/template.yaml
      - run: sam deploy --config-file packages/frontend/infrastructure/samconfig.toml --config-env ${{ github.event.inputs.env }}
      - run: aws s3 sync packages/frontend/.output/public s3://$ASSETS_BUCKET/
        env:
          ASSETS_BUCKET: ${{ steps.deploy.outputs.AssetsBucketName }} # 事前に sam deploy 出力を step output として拾う実装を追加してください
```

## テンプレートのポイント
- HTTP API（`AWS::Serverless::HttpApi`）で `/{proxy+}` に全ルートを転送。
- Lambda ランタイムは `nodejs20.x`、メモリ/タイムアウトはパラメータで可変。
- `SecretId` の Secrets Manager を参照し、値は実行時に Lambda Extension 経由で取得（`USE_AWS=true` の場合）。
- `NODE_ENV` のみ、AWS環境では Secrets Manager の dynamic reference で設定。
- `.output/public` 用に S3 バケットを自動作成（既存指定も可、削除ポリシーは Retain）。
- CloudWatch Logs は JSON 形式・保持日数をパラメータ化。

## 未決事項 / フラグ
- カスタムドメインを将来的に付与する場合は API Gateway 側のカスタムドメイン + Route53/ACM を別途追加する。
- S3 バケットの配信経路は現状未設定（直接 S3 または後日 CloudFront を追加予定）。
- CI での `ASSETS_BUCKET` 受け渡し方法（deploy step の Outputs 連携）を決める必要があります。
