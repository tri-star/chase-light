# デプロイメントガイド - Repository Monitoring System

## 概要

このガイドでは、GitHub リポジトリ監視システムのプロダクション環境への初回セットアップと運用手順について説明します。

## 前提条件

### 必要なツール

- AWS CLI v2.x（設定済み）
- AWS SAM CLI v1.x
- Node.js 24.x
- pnpm

### 必要なAWS権限

デプロイを実行するIAMユーザー/ロールには以下の権限が必要です：

- CloudFormation（スタック作成・更新・削除）
- Lambda（関数作成・更新）
- Step Functions（ステートマシン作成・更新）
- EventBridge（ルール作成・更新）
- SQS（キュー作成・管理）
- CloudWatch（ログ・アラート管理）
- SNS（トピック管理）
- IAM（ロール・ポリシー作成）
- SSM Parameter Store（パラメータ読み取り）

## 初回セットアップ

### 1. SSMパラメータストアの設定

プロダクション環境用のシークレット情報をSSMパラメータストアに保存します。

```bash
# Supabase DB接続URL
aws ssm put-parameter \
  --name "/prod/supabase/db_url" \
  --value "postgresql://username:password@host:port/database?sslmode=require" \
  --type "SecureString" \
  --description "Supabase DB connection URL for production"

# OpenAI API Key
aws ssm put-parameter \
  --name "/prod/openai/api_key" \
  --value "sk-your-openai-api-key" \
  --type "SecureString" \
  --description "OpenAI API key for production"
```

### 2. GitHub Actions環境変数・シークレット設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

#### Secrets

- `AWS_ROLE_ARN`: GitHubからAWSにアクセスするためのIAMロールARN

#### Variables

- `AWS_REGION`: デプロイするAWSリージョン（デフォルト: ap-northeast-1）
- `TEST_STEPFUNCTIONS`: デプロイ後にStep Functionsをテストするか（true/false）

### 3. AWS OIDC設定（推奨）

GitHubからAWSへの安全な認証のため、OIDCプロバイダーを設定：

```bash
# OIDC プロバイダー作成
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# IAMロール作成（trust policyでGitHubアクションを許可）
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-actions-trust-policy.json
```

trust policy例（`github-actions-trust-policy.json`）:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT-ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/your-repo:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

## デプロイ手順

### 自動デプロイ（推奨）

1. **GitHub Actionsでの手動実行**
   - GitHub > Actions タブで "Deploy" ワークフローを選択
   - "Run workflow" をクリック
   - 環境選択（dev/prod）を行って実行
   - ログを確認してエラーがないことを検証

2. **環境別デプロイ**
   - **dev環境**: 開発・テスト用。現在利用可能
   - **prod環境**: 本番環境用。将来的に利用予定

### 手動デプロイ

緊急時やローカルでのデプロイが必要な場合：

1. **依存関係インストール**

   ```bash
   pnpm install
   ```

2. **Lambdaビルド**

   ```bash
   pnpm --filter backend build:lambda
   ```

3. **SAMデプロイ**

   ```bash
   cd packages/backend/infrastructure

   # dev環境へのデプロイ
   sam deploy \
     --template-file sam-template.yaml \
     --stack-name chase-light-dev \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       UseAws=true \
       Stage=dev \
     --no-confirm-changeset

   # prod環境へのデプロイ（将来）
   sam deploy \
     --template-file sam-template.yaml \
     --stack-name chase-light-prod \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       UseAws=true \
       Stage=prod \
     --no-confirm-changeset
   ```

## 設定確認

### 1. EventBridgeスケジュール確認

```bash
# EventBridge ルール一覧表示
aws events list-rules --name-prefix "chase-light-dev"  # dev環境の場合
aws events list-rules --name-prefix "chase-light-prod" # prod環境の場合

# ルールの詳細確認
aws events describe-rule --name "chase-light-dev-repository-monitoring-schedule"  # dev環境
aws events describe-rule --name "chase-light-prod-repository-monitoring-schedule" # prod環境
```

### 2. Step Functions確認

```bash
# ステートマシン一覧
aws stepfunctions list-state-machines

# 手動実行テスト（環境に応じてARNを変更）
aws stepfunctions start-execution \
  --state-machine-arn "arn:aws:states:region:account:stateMachine:chase-light-dev-repository-monitoring" \
  --name "manual-test-$(date +%s)"
```

### 3. CloudWatchアラート確認

```bash
# アラーム一覧表示
aws cloudwatch describe-alarms --alarm-name-prefix "chase-light-dev"  # dev環境
aws cloudwatch describe-alarms --alarm-name-prefix "chase-light-prod" # prod環境

# SNSトピック確認
aws sns list-topics | grep chase-light-dev   # dev環境
aws sns list-topics | grep chase-light-prod  # prod環境
```

## 運用監視

### 日常監視項目

1. **Step Functions実行状況**
   - 毎日17:00の自動実行が成功しているか
   - 実行時間が異常に長くないか

2. **Lambda関数**
   - エラー率が5%を超えていないか
   - 実行時間が適切な範囲内か

3. **SQSキュー**
   - DLQにメッセージが蓄積していないか
   - 処理待ちメッセージが適切に消化されているか

### CloudWatch Logs Insightsクエリ

#### エラー分析

```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

#### パフォーマンス分析

```sql
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
```

### アラート対応手順

#### Step Functions実行失敗

1. CloudWatch Logs でエラーログを確認
2. 失敗原因を特定（GitHub API制限、DB接続エラーなど）
3. 必要に応じて手動で再実行

#### Lambda エラー率高騰

1. 特定のLambda関数を特定
2. エラーログで根本原因を調査
3. コード修正が必要な場合は緊急デプロイ

#### DLQメッセージ蓄積

1. DLQのメッセージ内容を確認
2. 処理失敗の原因を特定
3. 修正後、DLQメッセージを再処理

## トラブルシューティング

### よくある問題

#### 1. SAMデプロイ失敗

**症状**: CloudFormationスタック作成/更新エラー

**対処法**:

```bash
# スタック詳細確認
aws cloudformation describe-stack-events --stack-name chase-light-dev  # dev環境
aws cloudformation describe-stack-events --stack-name chase-light-prod # prod環境

# 注意: IAMロールの権限はTerraformで管理されており、必要最低限の権限が設定されています。
# 権限不足エラーが発生した場合は、CloudFormationスタックイベントのエラーメッセージを確認し、
# 必要な権限をTerraformのIAMポリシーに追加することを検討してください。
```

#### 2. Lambda関数でSSMパラメータ取得エラー

**症状**: Parameter not found エラー

**対処法**:

```bash
# パラメータ存在確認
aws ssm get-parameter --name "/prod/supabase/db_url"

# Lambda実行ロールにSSM権限追加（環境に応じてロール名を変更）
aws iam attach-role-policy \
  --role-name chase-light-dev-ListDataSourcesFunction-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess
```

#### 3. Step Functions実行権限エラー

**症状**: Unable to start execution エラー

**対処法**:

```bash
# EventBridge実行ロール確認（環境に応じてロール名を変更）
aws iam get-role --role-name chase-light-dev-EventBridgeExecutionRole

# 必要に応じてポリシー更新（環境に応じてロール名を変更）
aws iam put-role-policy \
  --role-name chase-light-dev-EventBridgeExecutionRole \
  --policy-name StepFunctionsExecutionPolicy \
  --policy-document file://stepfunctions-policy.json
```

### 緊急時対応

#### システム停止

```bash
# EventBridgeルール無効化（環境に応じて変更）
aws events disable-rule --name "chase-light-dev-repository-monitoring-schedule"

# Step Functions実行停止
aws stepfunctions stop-execution --execution-arn "実行中のARN"
```

#### システム復旧

```bash
# EventBridgeルール有効化（環境に応じて変更）
aws events enable-rule --name "chase-light-dev-repository-monitoring-schedule"

# 手動実行でテスト
aws stepfunctions start-execution \
  --state-machine-arn "ステートマシンARN" \
  --name "recovery-test-$(date +%s)"
```

## セキュリティ考慮事項

### シークレット管理

- すべてのAPIキー・DB認証情報はSSM Parameter Store（SecureString）で管理
- Lambda関数からの直接アクセスのみ許可
- 定期的なキーローテーション実施

### IAM権限

- 最小権限の原則に従った権限設定
- 定期的な権限監査の実施
- 不要なアクセス権限の削除

### 監視・ログ

- すべてのAPI呼び出しをCloudTrailで記録
- 異常なアクセスパターンの監視
- セキュリティインシデント対応手順の整備

## 更新・メンテナンス

### 定期作業

- 月次: CloudWatch ログの容量確認
- 四半期: IAM権限の棚卸し
- 半年: シークレットのローテーション
- 年次: アーキテクチャ全体の見直し

### アップデート手順

1. developブランチでの機能開発・テスト
2. mainブランチへのマージ
3. 自動デプロイによる本番反映
4. 監視による動作確認

このガイドを参考に、安全で効率的な運用を実現してください。
