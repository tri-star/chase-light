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

# 作業ディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

log "Chase Light開発環境を停止しています..."
cd "$BACKEND_DIR"

# SAM Localプロセスを停止
if [ -f "sam-local.pid" ]; then
    SAM_PID=$(cat sam-local.pid)
    if kill -0 $SAM_PID 2>/dev/null; then
        log "SAM Localを停止中... (PID: $SAM_PID)"
        kill $SAM_PID 2>/dev/null || true
        sleep 2
        
        # プロセスが残っている場合は強制終了
        if kill -0 $SAM_PID 2>/dev/null; then
            log_warning "SAM Localを強制終了中..."
            kill -9 $SAM_PID 2>/dev/null || true
        fi
    fi
    rm -f sam-local.pid
else
    # PIDファイルがない場合は、ポートを使用しているプロセスを探して終了
    if lsof -i:3001 >/dev/null 2>&1; then
        log "ポート3001を使用しているプロセスを停止中..."
        if lsof -ti:3001 >/dev/null 2>&1; then
            lsof -ti:3001 | xargs kill 2>/dev/null || true
        fi
    fi
fi

# Docker Composeサービスを停止
log "Docker Composeサービスを停止中..."
docker compose down 2>/dev/null || true

# ログファイルのクリーンアップ
rm -f sam-local.log

log_success "開発環境の停止が完了しました"