# 既存スクリプト機能分析結果

## 既存スクリプトの機能マッピング

### 1. start-local-dev.sh
**主要機能:**
- Docker Compose環境（PostgreSQL、ElasticMQ、StepFunctions Local）の起動
- Lambda関数のビルド (`pnpm build:lambda`)
- SAM Localの起動 (port 3001)
- 各サービスのヘルスチェック
- クリーンモード、待機モードのオプション対応

### 2. setup-stepfunctions-local.js
**主要機能:**
- ElasticMQ、StepFunctions Localの起動確認
- SQSキュー作成 (process-updates-queue)
- ASLテンプレートの変数置換
- ステートマシンの作成
- 実行例の表示

### 3. build-lambda.mjs + lambda-config.mjs
**主要機能:**
- Lambda関数のesbuildビルド
- 依存関係の管理
- package.json生成
- npm installの実行

### 4. stop-local-dev.sh
**主要機能:**
- SAM Localプロセスの停止
- Docker Composeサービスの停止
- ログファイルのクリーンアップ

## 機能重複の分析

### 重複機能
1. **サービス起動確認**: start-local-dev.sh と setup-stepfunctions-local.js
2. **ElasticMQ管理**: 両スクリプトで別々に管理
3. **StepFunctions Local管理**: 両スクリプトで別々に管理

### 欠落機能
1. **Lambda関数ビルドの統合**: setup-stepfunctions-local.jsではビルドステップが不完全
2. **統一されたエラーハンドリング**: スクリプト間で異なる

## 統合設計

### 新しいファイル構成

#### setup-local-environment.mjs
```
- Docker Compose サービス起動
- Lambda 関数ビルド (build-lambda.mjs 統合)
- SQS キュー作成
- ステートマシン作成
- 統一されたログ出力
- エラーハンドリング
```

#### stop-local-environment.mjs
```
- SAM Local停止
- Docker Compose停止
- クリーンアップ
```

### pnpm スクリプト名
- `local:setup` - 環境セットアップ
- `local:stop` - 環境停止
- `local:restart` - 環境再起動

### 設計原則
1. **機能統合**: 重複機能を単一のスクリプトに統合
2. **段階的実行**: 依存関係を考慮した順序での実行
3. **エラー処理**: 統一されたエラーハンドリングとロールバック
4. **ログ統一**: カラー付きログと実行状況の明確な表示
5. **設定外部化**: local-variables.json の活用