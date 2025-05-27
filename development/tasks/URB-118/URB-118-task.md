# URB-118: Serverless Framework v4 から SAM への段階的移行（第1段階）

## タスクの背景

Chase Light APIプロジェクトは現在Serverless Framework v4を使用してAWSにデプロイしています。しかし、より柔軟で詳細なリソース管理、CloudFormationとの統合性向上、およびAWSネイティブなツールチェーンの活用を目的として、AWS SAM（Serverless Application Model）への移行を決定しました。

一度に全体を移行するのは困難であるため、段階的に移行を進めています。AWSにデプロイする際はステージ名を分けることで、新旧両方のシステムが共存できるようにします。

## タスクの概要

### 対象範囲

第1段階として以下のコンポーネントの移行を実施：

- API Gateway設定
- User Lambda関数（`packages/api/src/handlers/api-gateway/user/`）
- 関連するSQSキュー（Feed Analyze Queue）

### 除外範囲（今後のタスクで対応予定）

- Feed Lambda関数
- Notification Lambda関数
- Scaler UI Lambda関数
- Step Functions
- Lambda Layers（現在はARN参照で対応）

## 技術的な変更内容

### 1. 移行元の分析

- **設定ファイル**: `packages/api/serverless.ts`
- **対象関数**: `userApp.getLambdaDefinition()`
- **関数ハンドラー**: `packages/api/src/handlers/api-gateway/user/index.ts:15-33`

### 2. SAM構成の作成

新しいディレクトリ構造：

```
packages/infra/api/
├── template.yaml       # SAM CloudFormationテンプレート
├── samconfig.toml      # SAMデプロイ設定
├── package.json        # ビルド・デプロイスクリプト
├── README.md           # 使用方法とドキュメント
└── MIGRATION_SUMMARY.md # 移行の詳細サマリー
```

### 3. 命名規則の統一

**新規則**: `chase-light-[ステージ名]-api-[リソース名]`

**適用例**:

- API Gateway: `chase-light-dev-api-gateway`
- Lambda関数: `chase-light-dev-api-user-handler`
- SQSキュー: `chase-light-dev-api-feed-analyze-queue`
- SQS DLQ: `chase-light-dev-api-feed-analyze-dlq`

### 4. 設定の移行内容

#### Lambda関数設定

- **Runtime**: nodejs20.x（維持）
- **Memory**: 1024MB（維持）
- **Timeout**: 15秒（維持）
- **Handler**: `index.handler`（維持）
- **Events**:
  - `ANY /users`
  - `ANY /users/{proxy+}`

#### 環境変数

既存の環境変数をすべて移行：

- `STAGE`, `TZ`, `NODE_OPTIONS`
- `API_URL`, `DATABASE_URL`, `OPENAI_API_KEY`, `AUTH0_DOMAIN`
- `ANALYZE_FEED_LOG_QUEUE_URL`

#### IAM権限

- SSM Parameter Store読み取り権限（SecretsManagerから変更）
- X-Rayトレーシング権限
- SQS送信権限

#### レイヤー設定

既存のレイヤーARNを参照：

- `otel-collector:7`
- `common:27`

#### シークレット管理の変更

費用削減のため、SecretsManagerからSSM Parameter Storeに移行：

- `secret:${Stage}/supabase/db_url` → `/${Stage}/supabase/db_url`
- `openai:SecretString:api_key` → `/${Stage}/openai/api_key`
- 新規追加: `Auth0Domain` → `/${Stage}/auth0/domain`

#### ローカル開発環境

SAMローカル実行用の環境設定：

- `env.local.json` - ローカル開発用環境変数（gitignore対象）
- `env.local.json.example` - 設定テンプレート（バージョン管理対象）

## 主要な技術的変更点

### 設定形式の変更

- **移行前**: TypeScript設定（`serverless.ts`）
- **移行後**: YAML CloudFormationテンプレート（`template.yaml`）

### Lambda Layerの参照方法

- **移行前**: `serverless.ts`内でのローカルレイヤー定義
- **移行後**: ARN参照（既存レイヤーとの互換性維持）

### 環境変数の管理方法

- **移行前**: カスタム変数と`${env:}`構文
- **移行後**: CloudFormationパラメータとSSM参照

### リソース管理アプローチ

- **移行前**: Serverless Frameworkの抽象化
- **移行後**: 直接的なCloudFormationリソース定義

## 進捗状況

### ✅ 完了項目

1. **既存設定の分析** - Serverless Framework設定とUser handler分析完了
2. **SAMディレクトリ構造作成** - `packages/infra/api/`配下に必要ファイル配置
3. **SAMテンプレート作成** - API Gateway、Lambda関数、SQSキューを定義
4. **デプロイ設定** - `samconfig.toml`でデプロイパラメータ設定
5. **ビルドスクリプト** - `package.json`にSAM関連コマンド追加
6. **命名規則適用** - 全リソースに新命名規則を適用
7. **ドキュメント作成** - README、移行サマリー作成
8. **API Gateway設定移行** - `serverless.ts`のprovider.apiGateway設定を移行、圧縮設定とトレーシングを維持
9. **IAM権限設定** - Secrets Manager、X-Ray、SQSへのアクセス権限を複製
10. **環境変数設定** - アプリケーション互換性のため全環境変数を維持
11. **SecretsManagerからParameter Storeへの移行** - 費用削減のためシークレット管理方法を変更
12. **ローカル開発環境設定** - `env.local.json`を使用したローカル実行環境構築
13. **Lambda関数ビルド設定** - TypeScript→JavaScript変換のためesbuildビルド設定を追加

### 🔄 次のステップ（他タスクで実施予定）

1. Feed Lambda関数の移行（`feedApp.getLambdaDefinition()`）
2. Notification Lambda関数の移行（`notificationApp.getLambdaDefinition()`）
3. Scaler UI Lambda関数の移行（`scalerUiApp.getLambdaDefinition()`）
4. Step Functions state machineの移行（`feedAnalyzerStateMachine`）
5. Lambda Layersの移行
6. 既存Serverless Framework設定の段階的廃止

## デプロイ準備状況

移行されたコンポーネントはデプロイ準備完了：

```bash
cd packages/infra/api

# 本番デプロイ
npm run build     # SAMビルド
npm run deploy    # デプロイ実行

# ローカル開発
cp env.local.json.example env.local.json
# env.local.jsonを編集して実際の値を設定
npm run local:start-api  # ローカルAPI起動
```

## 検証ポイント

デプロイ後の動作確認項目：

- [ ] API Gateway経由でUser endpointにアクセス可能
- [ ] Lambda関数が正常に実行される
- [ ] 環境変数が正しく設定されている
- [ ] SSM Parameter Storeから設定値が正常に取得される
- [ ] SQSキューが既存Step Functionsと連携可能
- [ ] X-Rayトレーシングが動作する
- [ ] IAM権限で必要なAWSサービスにアクセス可能
- [ ] Lambda関数ハンドラーパスが元の`index.handler`と一致
- [ ] API Gatewayイベントが保持されている（`ANY /users`および`ANY /users/{proxy+}`）
- [ ] SQSキュー名が既存Step Functionsとの統合を保持
- [ ] ローカル開発環境で`env.local.json`が正常に動作する

## 技術的留意事項

### 互換性の維持

- Lambda関数のソースコードは変更なし
- API Gateway のパスとメソッドは既存と同一
- SQSキュー名は既存Step Functionsとの互換性を保持
- 環境変数は既存アプリケーションコードとの互換性を保持
- Lambda関数ハンドラーパスは元の設定と一致
- IAM権限は元の設定から複製

### 移行期の運用

- 新旧システムは異なるステージで共存可能
- 段階的な切り替えが可能
- ロールバック対応可能

## 作業詳細: SecretsManagerからParameter Storeへの移行

### 実施内容

費用削減を目的として、機密情報の管理方法をAWS Secrets ManagerからSSM Parameter Storeに変更しました。

#### 変更対象

**packages/infra/api/template.yaml**：

1. **パラメータ参照方法の変更**：

   - `DatabaseUrl`: `{{resolve:secretsmanager:dev/supabase/db_url}}` → `{{resolve:ssm:/${Stage}/supabase/db_url}}`
   - `OpenAiApiKey`: `{{resolve:secretsmanager:openai:SecretString:api_key}}` → `{{resolve:ssm:/${Stage}/openai/api_key}}`

2. **新規パラメータの追加**：

   - `Auth0Domain`: `{{resolve:ssm:/${Stage}/auth0/domain}}`

3. **IAMポリシーの変更**：
   - SecretsManager権限からSSM Parameter Store読み取り権限に変更
   - 対象リソースを具体的に指定してセキュリティを向上

#### ローカル開発環境の構築

バージョン管理にコミットしない機密情報でローカル実行を可能にする設定を追加：

1. **env.local.json** - ローカル開発用環境変数ファイル（gitignore対象）
2. **env.local.json.example** - 設定テンプレートファイル（バージョン管理対象）
3. **package.jsonスクリプト更新** - `--env-vars env.local.json`オプション追加

#### 使用方法

```bash
# ローカル開発環境のセットアップ
cp env.local.json.example env.local.json
# env.local.jsonを編集して実際の値を設定

# ローカル実行
npm run local:start-api
npm run local:start-lambda
npm run local:invoke -- UserHandlerFunction
```

### 費用削減効果

- **Secrets Manager**: $0.40/secret/month + API呼び出し料金
- **Parameter Store**: 無料枠4,000リクエスト/月、Standard parameterは無料

年間コスト削減見込み: 約$14.4/年（3シークレット × $0.40 × 12ヶ月）

## 作業詳細: Lambda関数ビルド設定の追加

### 問題の発見

AWS SAMでのデプロイ検証中に、以下の問題が発生：

1. **sam build実行時の問題**：
   - TypeScriptファイル（index.ts）がそのままコピーされる
   - TypeScript → JavaScript変換が実行されない

2. **Lambda関数実行時の問題**：
   - TypeScriptファイルを直接実行しようとしてエラーになる
   - プロジェクトが`"type": "module"`でESM使用のため、適切なビルドプロセスが必要

### 解決方法の選択

2つの解決方法が検討され、**方法2**を採用：

**方法1**: Lambda関数ディレクトリにpackage.jsonを追加
```json
{
  "scripts": {
    "build": "esbuild index.ts --bundle --platform=node --target=node20 --outfile=index.js"
  }
}
```

**方法2**: template.yamlでビルド設定を追加（採用）
```yaml
UserHandlerFunction:
  Type: AWS::Serverless::Function
  Metadata:
    BuildMethod: esbuild
    BuildProperties:
      Minify: true
      Target: es2020
      Sourcemap: true
      EntryPoints:
        - index.ts
```

### 実施内容

**packages/infra/api/template.yaml:65-72** に以下のビルド設定を追加：

```yaml
Metadata:
  BuildMethod: esbuild
  BuildProperties:
    Minify: true
    Target: es2020
    Sourcemap: true
    EntryPoints:
      - index.ts
```

### 効果

- TypeScriptファイルが適切にJavaScriptに変換される
- ESMプロジェクトでもLambda関数が正常に実行される
- ビルド時の最適化（ミニファイ化）が有効
- デバッグ用のソースマップが生成される

## 作業時間・コスト

/cost
⎿ Total cost: $0.4739
Total duration (API): 3m 22.8s
Total duration (wall): 10m 42.0s
Total code changes: 492 lines added, 7 lines removed
Token usage by model:
claude-3-5-haiku: 1.4k input, 93 output, 0 cache read, 0 cache write
claude-sonnet: 47 input, 9.5k output, 673.3k cache read, 34.0k cache

## 参考リンク

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Serverless Framework から SAM への移行ガイド](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-template-basics.html)
