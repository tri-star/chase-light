# ServerlessFramework to SAM Migration Summary

## 課題番号: URB-118

### 移行完了日

2025年5月25日

### 移行対象

ServerlessFramework v4 → AWS SAM

### 実装内容

#### 1. SAMプロジェクト初期化

- `packages/infra/api/` ディレクトリ作成
- SAMテンプレート (`template.yaml`) 作成
- 環境別設定 (`samconfig.toml`) 作成
- ビルドスクリプト (`package.json`) 作成

#### 2. リソース命名規則適用

新しい命名規則: `chase-light-[ステージ名]-api-[リソース名]`

例：

- スタック名: `chase-light-dev-api-stack`
- API Gateway: `chase-light-dev-api-gateway`
- Lambda関数: `chase-light-dev-api-user-handler`
- SQSキュー: `chase-light-dev-api-feed-analyze-queue`

#### 3. 移行済みリソース

**API Gateway**

- ServerlessFrameworkの設定をSAMに移行
- 圧縮設定、トレーシング設定を維持
- リージョナルエンドポイント設定

**User Lambda関数**

- `packages/api/src/handlers/api-gateway/user/index.ts`
- イベント設定: `/users` および `/users/{proxy+}`
- 環境変数、レイヤー、IAMポリシーを移行

**SQSキューリソース**

- FeedAnalyzeQueue（メインキュー）
- FeedAnalyzeDlq（デッドレターキュー）
- RedrivePolicy設定を維持

#### 4. 環境別デプロイ設定

- local, dev, staging, prod 環境対応
- 環境ごとの異なるスタック名
- パラメータオーバーライド設定

#### 5. 環境変数とSecrets Manager連携

- DATABASE_URL: Secrets Managerから取得
- OPENAI_API_KEY: Secrets Managerから取得
- その他アプリケーション設定を維持

#### 6. IAMポリシー

- Secrets Manager アクセス権限
- X-Ray トレーシング権限
- SQS SendMessage 権限

#### 7. ビルドとデプロイスクリプト

- `npm run build`: SAMビルド
- `npm run deploy:dev`: 開発環境デプロイ
- `npm run start:local`: ローカル起動
- その他運用コマンド一式

### コードパス設定

- CodeUri: `../../api/src/handlers/api-gateway/user/`
- 既存のapiパッケージのコードを参照

### 今後の移行予定

1. Feed Lambda関数の移行
2. Notification Lambda関数の移行
3. Step Functions (Feed Analyzer) の移行
4. その他のハンドラーの移行

### 検証状況

- ✅ SAMテンプレート構文検証完了 (`sam validate`)
- 🔄 実際のデプロイと動作確認は次のステップ

### 注意事項

- 既存のServerlessFrameworkデプロイとは別スタックとして管理
- ステージ名を分けることで両方の環境が共存可能
- プロダクション環境での移行は段階的に実施予定
