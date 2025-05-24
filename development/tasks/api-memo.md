# API開発メモ

このファイルは、Chase Light APIプロジェクトでの開発作業中に学んだ知識や重要な情報を記録するためのメモファイルです。

## ServerlessFramework to SAM 移行 (URB-118)

### プロジェクト構造と設定

#### 既存のServerlessFramework設定

- **ファイル**: `packages/api/serverless.ts`
- **フレームワーク**: Serverless Framework v4
- **ビルドツール**: esbuild (bundle: true, minify: false)
- **ランタイム**: Node.js 20.x
- **リージョン**: ap-northeast-1
- **メモリ**: 1024MB
- **レイヤー**: otel-collector, common レイヤーを使用
- **パッケージング**: individually: true（関数ごとに個別パッケージ）

#### User Lambda関数の構造

- **パス**: `packages/api/src/handlers/api-gateway/user/index.ts`
- **フレームワーク**: Hono (AWS Lambda向け)
- **ハンドラー**: 15-33行目にLambda定義
- **エンドポイント**:
  - `users/{proxy+}` (ANY)
  - `users` (ANY)
- **アーキテクチャ**: ChaseLightAppクラスを継承したアプリケーション構造

### 新しいリソース命名規則

```
chase-light-[ステージ名]-api-[リソース名]
```

#### 例:

- スタック名: `chase-light-dev-api-stack`
- API Gateway: `chase-light-dev-api-gateway`
- Lambda関数: `chase-light-dev-api-user-handler`
- SQSキュー: `chase-light-dev-api-feed-analyze-queue`

### SAM移行で学んだポイント

#### 1. SAMテンプレート設計

- **場所**: `packages/infra/api/template.yaml`
- **ポイント**:
  - Globalsセクションで共通設定を定義
  - 環境変数はParameters + Globalsで管理
  - Secrets Manager連携: `{{resolve:secretsmanager:key}}`形式

#### 2. 環境別設定管理

- **ファイル**: `samconfig.toml`
- **構造**:
  ```toml
  [default]  # local環境
  [dev]      # 開発環境
  [staging]  # ステージング環境
  [prod]     # 本番環境
  ```
- **ポイント**: `parameter_overrides`でステージ名を渡す

#### 3. CodeUri設定

- **相対パス**: `../../api/src/handlers/api-gateway/user/`
- **重要**: SAMビルド時に既存のapiパッケージコードを参照
- **注意**: 既存コードを移動させずに参照する設計

#### 4. IAMポリシー設定

```yaml
Policies:
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - secretsmanager:GetSecretValue
          - secretsmanager:DescribeSecret
        Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${Stage}/supabase/db_url*'
```

#### 5. package.json での注意点

- **問題**: 初期作成時に`@aws-sdk/client-apigateway`（間違った名前）を記載
- **正解**: `@aws-sdk/client-api-gateway`（ハイフン付き）
- **最終判断**: SAMプロジェクトではAWS SDK依存関係は不要（削除）

### Git運用

#### ブランチ戦略

- 課題番号でブランチ作成: `URB-118`
- コミット分割:
  1. タスク定義
  2. SAMテンプレート・基本設定
  3. ビルド設定
  4. ドキュメント
  5. 設定ファイル

#### コミット時の設定

```bash
export GIT_COMMITTER_NAME="GitHub Copilot"
export GIT_COMMITTER_EMAIL="copilot@github.com"
```

- **注意**: `git config user.name`は著者情報も変えてしまうので使わない
- **目的**: コミッターとしてGitHub Copilotを識別

### 段階的移行戦略

#### 完了済み（URB-118）

- ✅ API Gateway設定
- ✅ User Lambda関数
- ✅ SQSキュー（Feed分析用）
- ✅ 環境別デプロイ設定

#### 今後の移行予定

- 🔄 Feed Lambda関数 (`feedApp.getLambdaDefinition()`)
- 🔄 Notification Lambda関数 (`notificationApp.getLambdaDefinition()`)
- 🔄 Scaler UI Lambda関数 (`scalerUiApp.getLambdaDefinition()`)
- 🔄 Step Functions (`feedAnalyzerStateMachine`)
- 🔄 Feed Analyzer Handlers (`feedAnalyzerHandlers`)

### トラブルシューティング

#### よくある問題

1. **npm install エラー**: パッケージ名の間違い（apigateway vs api-gateway）
2. **JSON構文エラー**: 余分な括弧や不正な形式
3. **SAM validate**: 構文チェックは `sam validate` で実行可能

#### デバッグコマンド

```bash
# 構文チェック
npm run validate

# ローカル実行
npm run start:local

# ログ確認
npm run logs:user

# ビルド確認
npm run build
```

### 次のセッションに向けた重要情報

#### プロジェクト理解

- Chase Lightは段階的にServerlessFramework→SAM移行中
- 既存コードは`packages/api/`に存在、SAM設定は`packages/infra/api/`
- 新旧両方のデプロイが共存可能な設計

#### 技術スタック

- **Lambda**: Node.js 20.x + Hono フレームワーク
- **API Gateway**: REST API
- **データベース**: Supabase (DATABASE_URL)
- **AI**: OpenAI API (OPENAI_API_KEY)
- **認証**: Auth0
- **監視**: X-Ray トレーシング + OpenTelemetry

#### ファイル参照先

- ServerlessFramework設定: `packages/api/serverless.ts`
- User Lambda実装: `packages/api/src/handlers/api-gateway/user/index.ts`
- SAM設定: `packages/infra/api/template.yaml`
- 移行記録: `packages/infra/api/MIGRATION_SUMMARY.md`

---

**更新日**: 2025年5月25日
**担当**: GitHub Copilot
**課題**: URB-118
