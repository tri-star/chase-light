#!/bin/bash

# StepFunctions Local環境セットアップスクリプト
# 本番用ASLテンプレートの変数をローカル環境用に置換してステートマシンを作成

set -e

# 色付きメッセージ関数
info() { echo -e "\e[34m[INFO]\e[0m $1"; }
success() { echo -e "\e[32m[SUCCESS]\e[0m $1"; }
error() { echo -e "\e[31m[ERROR]\e[0m $1"; }
warn() { echo -e "\e[33m[WARN]\e[0m $1"; }

# 環境変数設定
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1

# ElasticMQエンドポイント
ELASTICMQ_ENDPOINT="http://localhost:9324"
ELASTICMQ_INTERNAL_ENDPOINT="http://elasticmq:9324"  # Docker内部通信用

# StepFunctions Localエンドポイント
STEPFUNCTIONS_ENDPOINT="http://localhost:8083"

# ファイルパス
ASL_TEMPLATE="infrastructure/repository-monitoring.asl.json"
ASL_TEMP="infrastructure/.repository-monitoring-local.tmp.json"
STATE_MACHINE_NAME="repository-monitoring-local"

info "StepFunctions Local環境をセットアップしています..."

# 1. ElasticMQの起動確認
info "ElasticMQの起動確認中..."
if ! curl -s "$ELASTICMQ_ENDPOINT" > /dev/null 2>&1; then
    error "ElasticMQが起動していません。'docker compose up -d' を実行してください。"
    exit 1
fi
success "ElasticMQ接続確認完了"

# 2. StepFunctions Localの起動確認
info "StepFunctions Localの起動確認中..."
if ! curl -s "$STEPFUNCTIONS_ENDPOINT" > /dev/null 2>&1; then
    error "StepFunctions Localが起動していません。'docker compose up -d' を実行してください。"
    exit 1
fi
success "StepFunctions Local接続確認完了"

# 3. SQSキューの作成
info "必要なSQSキューを作成中..."
aws --region ap-northeast-1 --endpoint-url "$ELASTICMQ_ENDPOINT" \
    sqs create-queue --queue-name process-updates-queue > /dev/null 2>&1 || warn "キューは既に存在します"
success "SQSキュー作成完了"

# 4. ASLテンプレートの変数置換
info "ASLテンプレートの変数を置換中..."

# 本番用ASLテンプレートを読み込み、ローカル環境用に変数を置換
sed \
    -e "s|\${ProcessUpdatesQueueUrl}|$ELASTICMQ_INTERNAL_ENDPOINT/000000000000/process-updates-queue|g" \
    -e "s|\${ListDataSourcesFunction.Arn}|list-datasources|g" \
    -e "s|\${DetectDataSourceUpdatesFunctionArn}|detect-datasource-updates|g" \
    "$ASL_TEMPLATE" > "$ASL_TEMP"

success "変数置換完了"

# 5. 既存のステートマシンが存在するか確認し、削除
info "既存のステートマシンをチェック中..."
EXISTING_ARN=$(aws stepfunctions list-state-machines \
    --endpoint-url "$STEPFUNCTIONS_ENDPOINT" \
    --query "stateMachines[?name=='$STATE_MACHINE_NAME'].stateMachineArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ARN" ] && [ "$EXISTING_ARN" != "None" ]; then
    warn "既存のステートマシンを削除中: $STATE_MACHINE_NAME"
    aws stepfunctions delete-state-machine \
        --endpoint-url "$STEPFUNCTIONS_ENDPOINT" \
        --state-machine-arn "$EXISTING_ARN" > /dev/null
    success "既存のステートマシン削除完了"
fi

# 6. ステートマシンの作成
info "ステートマシンを作成中..."
STATE_MACHINE_ARN=$(aws stepfunctions create-state-machine \
    --endpoint-url "$STEPFUNCTIONS_ENDPOINT" \
    --name "$STATE_MACHINE_NAME" \
    --definition "file://$ASL_TEMP" \
    --role-arn "arn:aws:iam::123456789012:role/DummyRole" \
    --query 'stateMachineArn' --output text)

success "ステートマシン作成完了: $STATE_MACHINE_ARN"

# 7. 一時ファイルの削除
rm -f "$ASL_TEMP"

# 8. 実行例の表示
info "=== セットアップ完了 ==="
echo ""
echo "ステートマシンARN: $STATE_MACHINE_ARN"
echo ""
echo "実行例:"
echo "  aws stepfunctions start-execution \\"
echo "    --endpoint-url $STEPFUNCTIONS_ENDPOINT \\"
echo "    --state-machine-arn '$STATE_MACHINE_ARN' \\"
echo "    --input '{\"sourceType\": \"github_repository\"}'"
echo ""
echo "キューメッセージ確認:"
echo "  aws --region ap-northeast-1 --endpoint-url $ELASTICMQ_ENDPOINT \\"
echo "    sqs receive-message \\"
echo "    --queue-url $ELASTICMQ_ENDPOINT/000000000000/process-updates-queue"
echo ""
echo "ElasticMQ Web UI: http://localhost:9325"