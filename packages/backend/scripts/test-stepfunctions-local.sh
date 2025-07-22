#!/bin/bash

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ出力関数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# ヘルプメッセージを表示する関数
show_usage() {
    echo "Usage: $0 [TEST_CASE]"
    echo ""
    echo "Step Functions Local のモックテストを実行します。"
    echo ""
    echo "TEST_CASE:"
    echo "  HappyPathTest    正常系テスト（複数のデータソースを返す）"
    echo "  ErrorPathTest    エラー系テスト（データベース接続エラー）"
    echo "  EmptyResultTest  空結果テスト（データソースが存在しない）"
    echo "  all              全てのテストケースを実行（デフォルト）"
    echo ""
    echo "OPTIONS:"
    echo "  --help, -h       このヘルプメッセージを表示"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                     全てのテストケースを実行"
    echo "  $0 HappyPathTest       正常系テストのみ実行"
    echo "  $0 all                 全てのテストケースを実行"
    echo ""
}

# Step Functions Local の接続確認
check_stepfunctions_local() {
    log "Step Functions Local の接続を確認中..."
    if ! nc -z localhost 8083 > /dev/null 2>&1; then
        log_error "Step Functions Local に接続できません"
        log_error "開発環境が起動していることを確認してください:"
        log_error "  ./scripts/start-local-dev.sh"
        exit 1
    fi
    log_success "Step Functions Local への接続が確認できました"
}

# State Machine の存在確認と作成
ensure_state_machine() {
    log "State Machine の存在を確認中..."
    
    # 既存の State Machine を確認
    if aws stepfunctions list-state-machines --endpoint-url http://localhost:8083 \
        | grep -q "repository-monitoring-local"; then
        log_success "State Machine が存在することを確認しました"
        return 0
    fi
    
    log "State Machine が存在しません。作成中..."
    
    # State Machine を作成
    if aws stepfunctions create-state-machine \
        --endpoint-url http://localhost:8083 \
        --definition file://infrastructure/repository-monitoring.asl.json \
        --name "repository-monitoring-local" \
        --role-arn "arn:aws:iam::123456789012:role/DummyRole" \
        > /dev/null 2>&1; then
        log_success "State Machine を作成しました"
    else
        log_error "State Machine の作成に失敗しました"
        exit 1
    fi
}

# 単一テストケースの実行
run_test_case() {
    local test_case=$1
    local expected_outcome=$2  # "SUCCEEDED" または "FAILED"
    local execution_name="${test_case,,}Execution"
    
    log "[$test_case] テストケースを実行中..."
    
    # テスト実行
    local result
    result=$(aws stepfunctions start-execution \
        --endpoint http://localhost:8083 \
        --name "${execution_name}" \
        --state-machine "arn:aws:states:us-east-1:123456789012:stateMachine:repository-monitoring-local#${test_case}" \
        --input '{}' )
    
    if [ $? -ne 0 ]; then
        log_error "[$test_case] テスト実行に失敗しました"
        return 1
    fi
    
    # execution ARN を抽出
    local execution_arn
    echo $result
    execution_arn=$(echo "$result" | grep -o '"executionArn": "[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$execution_arn" ]; then
        log_error "[$test_case] execution ARN の取得に失敗しました"
        return 1
    fi
    
    log "[$test_case] 実行ARN: $execution_arn"
    
    # 実行完了を待機（最大30秒）
    local timeout=30
    local counter=0
    while [ $counter -lt $timeout ]; do
        local status
        status=$(aws stepfunctions describe-execution \
            --endpoint http://localhost:8083 \
            --execution-arn "$execution_arn" \
            --query 'status' \
            --output text 2>/dev/null)
        
        case "$status" in
            "SUCCEEDED")
                if [ "$expected_outcome" = "SUCCEEDED" ]; then
                    log_success "[$test_case] テスト実行が期待通り成功しました"
                    
                    # 実行履歴から結果を表示
                    local output
                    output=$(aws stepfunctions get-execution-history \
                        --endpoint http://localhost:8083 \
                        --execution-arn "$execution_arn" \
                        --query 'events[?type==`ExecutionSucceeded`].executionSucceededEventDetails.output' \
                        --output text 2>/dev/null)
                    
                    if [ -n "$output" ] && [ "$output" != "None" ]; then
                        log "[$test_case] 実行結果: $output"
                    fi
                    return 0
                else
                    log_error "[$test_case] 期待される結果は失敗でしたが、成功しました"
                    return 1
                fi
                ;;
            "FAILED")
                if [ "$expected_outcome" = "FAILED" ]; then
                    log_success "[$test_case] テスト実行が期待通り失敗しました（テスト成功）"
                    
                    # エラー詳細を情報として表示
                    local error_details
                    error_details=$(aws stepfunctions get-execution-history \
                        --endpoint http://localhost:8083 \
                        --execution-arn "$execution_arn" \
                        --query 'events[?type==`ExecutionFailed`].executionFailedEventDetails' \
                        --output text 2>/dev/null)
                    
                    if [ -n "$error_details" ] && [ "$error_details" != "None" ]; then
                        log "[$test_case] エラー詳細: $error_details"
                    fi
                    return 0
                else
                    log_error "[$test_case] テスト実行が予期せず失敗しました"
                    
                    # エラー詳細を表示
                    local error_details
                    error_details=$(aws stepfunctions get-execution-history \
                        --endpoint http://localhost:8083 \
                        --execution-arn "$execution_arn" \
                        --query 'events[?type==`ExecutionFailed`].executionFailedEventDetails' \
                        --output text 2>/dev/null)
                    
                    if [ -n "$error_details" ] && [ "$error_details" != "None" ]; then
                        log_error "[$test_case] エラー詳細: $error_details"
                    fi
                    return 1
                fi
                ;;
            "RUNNING")
                sleep 1
                counter=$((counter + 1))
                ;;
            *)
                log_error "[$test_case] 不明なステータス: $status"
                return 1
                ;;
        esac
    done
    
    log_error "[$test_case] タイムアウト（${timeout}秒）"
    return 1
}

# メイン処理
main() {
    local test_case="${1:-all}"
    
    # ヘルプオプションの処理
    case "$test_case" in
        --help|-h)
            show_usage
            exit 0
            ;;
    esac
    
    # 作業ディレクトリを確認
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
    
    log "Chase Light Step Functions Local テストを開始します"
    log "Backend Directory: $BACKEND_DIR"
    
    # バックエンドディレクトリに移動
    cd "$BACKEND_DIR"
    
    # 前提条件の確認
    check_stepfunctions_local
    ensure_state_machine
    
    echo ""
    log "=== テスト実行開始 ==="
    
    local failed_tests=()
    local success_count=0
    local total_count=0
    
    # テストケース定義（名前:期待される結果の形式）
    declare -A test_definitions=(
        ["HappyPathTest"]="SUCCEEDED"
        ["ErrorPathTest"]="FAILED"
        ["EmptyResultTest"]="SUCCEEDED"
    )
    
    # テストケースに応じて実行
    case "$test_case" in
        "HappyPathTest"|"ErrorPathTest"|"EmptyResultTest")
            # 単一テストケースの実行
            if [ -z "${test_definitions[$test_case]}" ]; then
                log_error "不明なテストケース: $test_case"
                echo ""
                show_usage
                exit 1
            fi
            
            total_count=1
            if run_test_case "$test_case" "${test_definitions[$test_case]}"; then
                success_count=1
            else
                failed_tests+=("$test_case")
            fi
            ;;
        "all")
            # 全テストケースの実行
            local test_cases=($(printf '%s\n' "${!test_definitions[@]}" | sort))
            total_count=${#test_cases[@]}
            
            for tc in "${test_cases[@]}"; do
                if run_test_case "$tc" "${test_definitions[$tc]}"; then
                    success_count=$((success_count + 1))
                else
                    failed_tests+=("$tc")
                fi
                echo ""
            done
            ;;
        *)
            log_error "不明なテストケース: $test_case"
            echo ""
            show_usage
            exit 1
            ;;
    esac
    
    # 結果サマリー
    echo ""
    log "=== テスト結果サマリー ==="
    log_success "成功: $success_count/$total_count"
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_success "全てのテストが成功しました！"
        exit 0
    else
        log_error "失敗: ${#failed_tests[@]}/$total_count"
        log_error "失敗したテスト: ${failed_tests[*]}"
        exit 1
    fi
}

# スクリプト実行
main "$@"