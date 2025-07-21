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

# 環境変数の設定
export DB_PORT=${DB_PORT:-5432}

# 作業ディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

log "Chase Light StepFunctions Local開発環境を起動します"
log "Backend Directory: $BACKEND_DIR"

# 既存のコンテナを停止・削除
log "既存のコンテナを停止・削除中..."
cd "$BACKEND_DIR"
docker compose down -v 2>/dev/null || true

# Lambda関数のビルド
log "Lambda関数をビルド中..."
pnpm build:lambda

# ビルド結果の確認
if [ ! -d "dist/lambda/list-datasources" ]; then
    log_error "Lambda関数のビルドに失敗しました: dist/lambda/list-datasources ディレクトリが見つかりません"
    exit 1
fi

log_success "Lambda関数のビルドが完了しました"

# Docker Composeサービスを起動
log "PostgreSQL と StepFunctions Local を起動中..."
docker compose up -d

# サービスの起動を待機
log "サービスの起動を待機中..."
sleep 10

# PostgreSQLの起動確認
log "PostgreSQLの起動を確認中..."
timeout=60
counter=0
while ! docker compose exec db pg_isready -U postgres -d chase_light >/dev/null 2>&1; do
    if [ $counter -gt $timeout ]; then
        log_error "PostgreSQLの起動がタイムアウトしました"
        docker compose logs db
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done
log_success "PostgreSQLが起動しました"

# StepFunctions Localの起動確認
log "StepFunctions Localの起動を確認中..."
counter=0
while ! curl -f http://localhost:8083/ >/dev/null 2>&1; do
    if [ $counter -gt $timeout ]; then
        log_error "StepFunctions Localの起動がタイムアウトしました"
        docker compose logs stepfunctions-local
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done
log_success "StepFunctions Localが起動しました"

# バックグラウンドでSAM Localを起動
log "SAM Local を起動中..."
cd "$BACKEND_DIR"

# SAM Local用のポートが空いているかチェック
if lsof -i:3001 >/dev/null 2>&1; then
    log_warning "ポート3001が既に使用されています。既存のプロセスを停止してください。"
    lsof -i:3001
fi

# SAM Localを起動（バックグラウンド）
log "SAM Localをバックグラウンドで起動中..."
sam local start-lambda \
    --host 0.0.0.0 \
    --port 3001 \
    --template infrastructure/sam-template.yaml \
    --env-vars infrastructure/env.json \
    --docker-network host \
    > sam-local.log 2>&1 &

SAM_PID=$!
echo $SAM_PID > sam-local.pid

# SAM Localの起動を待機
log "SAM Localの起動を待機中..."
counter=0
while ! curl -f http://localhost:3001/2015-03-31/functions/list-datasources/invocations >/dev/null 2>&1; do
    if [ $counter -gt 60 ]; then
        log_error "SAM Localの起動がタイムアウトしました"
        kill $SAM_PID 2>/dev/null || true
        cat sam-local.log
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
done

log_success "SAM Localが起動しました (PID: $SAM_PID)"

# 環境の起動完了
log_success "=== 開発環境の起動が完了しました ==="
echo ""
log_success "サービス一覧:"
log_success "  - PostgreSQL: localhost:${DB_PORT}"
log_success "  - StepFunctions Local: http://localhost:8083"
log_success "  - SAM Local: http://localhost:3001"
echo ""
log_success "停止する場合は以下を実行してください:"
log_success "  ./scripts/stop-local-dev.sh"
echo ""
log_success "または Ctrl+C で停止できます"

# Ctrl+Cでの終了処理
cleanup() {
    log "開発環境を停止中..."
    kill $SAM_PID 2>/dev/null || true
    docker compose down
    rm -f sam-local.pid sam-local.log
    log_success "開発環境を停止しました"
    exit 0
}

trap cleanup INT TERM

# フォアグラウンドプロセスとして待機
if [ "$1" = "--wait" ] || [ "$1" = "-w" ]; then
    log "開発環境が起動しています。Ctrl+Cで停止してください。"
    wait $SAM_PID
fi