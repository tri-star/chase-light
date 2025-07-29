# StepFunctions 実行用入力データサンプル

このディレクトリには、StepFunctionsワークフローを実行するための入力データサンプルが含まれています。

## ファイル一覧

### repository-monitoring-basic.json
基本的なリポジトリ監視実行用の入力データです。

**使用例:**
```bash
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn 'arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local' \
  --input file://infrastructure/events/repository-monitoring-basic.json
```

### repository-monitoring-test.json  
テストモード用のリポジトリ監視実行データです。

**使用例:**
```bash
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn 'arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local' \
  --input file://infrastructure/events/repository-monitoring-test.json
```

## 入力データの形式

### 共通パラメータ
- `sourceType`: データソースの種類（現在は"github_repository"のみ対応）
- `description`: 実行の説明（オプション）

### テスト用パラメータ  
- `testMode`: テストモードフラグ（オプション）

## 使用方法

1. ローカル環境をセットアップ:
   ```bash
   pnpm local:setup
   ```

2. 任意の入力データでワークフローを実行:
   ```bash
   aws stepfunctions start-execution \
     --endpoint-url http://localhost:8083 \
     --state-machine-arn 'arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local' \
     --input file://infrastructure/events/[ファイル名]
   ```

3. 実行結果の確認:
   ```bash
   aws stepfunctions list-executions \
     --endpoint-url http://localhost:8083 \
     --state-machine-arn 'arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local'
   ```