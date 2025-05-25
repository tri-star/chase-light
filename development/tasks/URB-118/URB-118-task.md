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

- Secrets Manager読み取り権限
- X-Rayトレーシング権限
- SQS送信権限

#### レイヤー設定

既存のレイヤーARNを参照：

- `otel-collector:7`
- `common:27`

## 進捗状況

### ✅ 完了項目

1. **既存設定の分析** - Serverless Framework設定とUser handler分析完了
2. **SAMディレクトリ構造作成** - `packages/infra/api/`配下に必要ファイル配置
3. **SAMテンプレート作成** - API Gateway、Lambda関数、SQSキューを定義
4. **デプロイ設定** - `samconfig.toml`でデプロイパラメータ設定
5. **ビルドスクリプト** - `package.json`にSAM関連コマンド追加
6. **命名規則適用** - 全リソースに新命名規則を適用
7. **ドキュメント作成** - README、移行サマリー作成

### 🔄 次のステップ（他タスクで実施予定）

1. Feed Lambda関数の移行
2. Notification Lambda関数の移行
3. Step Functions state machineの移行
4. Lambda Layersの移行
5. 既存Serverless Framework設定の段階的廃止

## デプロイ準備状況

移行されたコンポーネントはデプロイ準備完了：

```bash
cd packages/infra/api
npm run build     # SAMビルド
npm run deploy    # デプロイ実行
```

## 検証ポイント

デプロイ後の動作確認項目：

- [ ] API Gateway経由でUser endpointにアクセス可能
- [ ] Lambda関数が正常に実行される
- [ ] 環境変数が正しく設定されている
- [ ] SQSキューが既存Step Functionsと連携可能
- [ ] X-Rayトレーシングが動作する
- [ ] IAM権限で必要なAWSサービスにアクセス可能

## 技術的留意事項

### 互換性の維持

- Lambda関数のソースコードは変更なし
- API Gateway のパスとメソッドは既存と同一
- SQSキュー名は既存Step Functionsとの互換性を保持
- 環境変数は既存アプリケーションコードとの互換性を保持

### 移行期の運用

- 新旧システムは異なるステージで共存可能
- 段階的な切り替えが可能
- ロールバック対応可能

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
