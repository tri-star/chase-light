# CHASE-83: StepFunctions ローカル環境整備 SOW

## 目標
1. StepFunctionsLocal + ElasticMQを利用したローカル環境でStepFunctionsワークフローの動作確認実現
2. 分散された複数スクリプト（bash, js, mjs）をmjsに統合し、`pnpm xxx`コマンド経由で実行可能にする

## 現状分析
### 既存のスクリプト
- `start-local-dev.sh` / `stop-local-dev.sh`: SAM Local + StepFunctions環境の起動/停止
- `setup-stepfunctions-local.js` / `.sh`: ElasticMQ + StepFunctions Localセットアップ
- `build-lambda.mjs` / `lambda-config.mjs`: Lambda関数ビルド
- `compose.yml`: PostgreSQL、ElasticMQ、StepFunctions Localコンテナ定義
- `package.json`: 既存のnpmスクリプト定義

### 問題点
- 機能重複（複数のセットアップスクリプト）
- スクリプト形式の混在（bash/js/mjs）
- 一部Lambda関数ビルドステップが欠落

## 実施計画

### タスク1: 既存スクリプト統合検討と設計
- 既存スクリプトの機能分析
- 統合後のmjsファイル構成決定
- pnpmスクリプト名の決定

### タスク2: 統合セットアップスクリプト作成
- `packages/backend/scripts/setup-local-environment.mjs` 作成
- SAM Local + StepFunctions Local + ElasticMQの統合セットアップ
- Lambda関数ビルドを含む完全なワークフロー実装

### タスク3: 停止スクリプト作成（必要に応じ）
- `packages/backend/scripts/stop-local-environment.mjs` 作成
- 環境クリーンアップ機能

### タスク4: 入力データサンプル作成
- `packages/backend/infrastructure/events/` 配下にワークフロー開始用JSONファイル作成
- repository-monitoring用の入力データ例

### タスク5: package.json更新
- 新しいmjsスクリプト用のnpmスクリプト追加
- 既存スクリプトとの整合性確保

### タスク6: ドキュメント更新
- `packages/backend/docs/local-environment.md` の更新
- 新しいセットアップ手順の記載
- 動作確認手順の更新

### タスク7: 動作確認とテスト
- 統合されたスクリプトでの環境構築テスト
- StepFunctions実行テスト
- 既存機能との互換性確認

### タスク8: 古いスクリプトのクリーンアップ
- 不要になったbash/jsスクリプトの削除または非推奨化
- リポジトリクリーンアップ

## 成果物
1. `setup-local-environment.mjs` - 統合セットアップスクリプト
2. `stop-local-environment.mjs` - 停止スクリプト（必要に応じ）
3. `infrastructure/events/` - 入力データサンプル
4. 更新された `package.json`
5. 更新された `local-environment.md`
6. 動作確認済みのローカル環境

## 推定工数
- 分析・設計：2時間
- 実装：4-6時間
- テスト・ドキュメント：2時間
- 合計：8-10時間

## 技術的考慮事項
- 既存のlambda-config.mjsとの連携
- Docker Composeサービスとの整合性
- エラーハンドリングとログ出力の統一
- クロスプラットフォーム対応

## 次回セッション開始時の作業
1. TodoListの確認とタスク1から開始
2. 既存スクリプトの詳細分析
3. 統合設計の決定
4. 実装に着手

## 関連ファイル
- `packages/backend/scripts/` - 既存スクリプト群
- `packages/backend/compose.yml` - Docker設定
- `packages/backend/infrastructure/` - StepFunctions関連設定
- `packages/backend/docs/local-environment.md` - 既存ドキュメント