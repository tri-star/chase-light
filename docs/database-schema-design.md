# データベーススキーマ設計

## エンティティ概要

### 1. Users（ユーザー）
既存のsessionsテーブルの情報を基に、ユーザー情報を管理

### 2. Data_Sources（データソース）
監視対象のデータソース（GitHub）の種別管理
※将来的にNPM等も対応予定

### 3. Repositories（リポジトリ）
GitHubリポジトリ情報（data_sources経由で管理）

### 4. User_Watches（ユーザー監視設定）
ユーザーが監視している対象の管理（多対多の関係）

### 5. Events（イベント）
各データソースで発生したイベント（リリース、PR、Issue等）

### 6. User_Preferences（ユーザー設定）
通知設定、言語設定等のユーザー固有設定

### 7. Bookmarks（ブックマーク）
ユーザーがブックマークしたイベントやデータソース

### 8. Notifications（通知）
ユーザーへの通知履歴

## 将来の拡張計画

### NPM対応（将来実装予定）
- Packages（パッケージ）テーブル
- NPM固有のイベント種別

## 詳細テーブル設計

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    auth0_user_id VARCHAR(255) UNIQUE NOT NULL,     -- Auth0のuser_id
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT '',
    avatar_url TEXT DEFAULT '',
    github_username VARCHAR(255) DEFAULT '',        -- GitHubユーザー名
    timezone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### data_sources
```sql
CREATE TABLE data_sources (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    source_type VARCHAR(50) NOT NULL,               -- 'github_repository'
    source_id VARCHAR(500) NOT NULL,                -- GitHubの場合は'owner/repo'
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    url TEXT NOT NULL,                               -- データソースのURL
    is_private BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_type, source_id)
);
```

### repositories
```sql
CREATE TABLE repositories (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    github_id BIGINT UNIQUE NOT NULL,               -- GitHubのリポジトリID
    full_name VARCHAR(255) NOT NULL,                -- "owner/repo"形式
    owner VARCHAR(255) NOT NULL,                    -- リポジトリオーナー
    html_url TEXT NOT NULL,                         -- GitHub HTMLページURL
    clone_url TEXT DEFAULT '',
    ssh_url TEXT DEFAULT '',
    language VARCHAR(100) DEFAULT '',               -- 主要プログラミング言語
    stars_count INTEGER DEFAULT 0,                  -- スター数
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    is_fork BOOLEAN DEFAULT false,
    default_branch VARCHAR(255) DEFAULT 'main'
);
```

### user_watches
```sql
CREATE TABLE user_watches (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT true,
    watch_releases BOOLEAN DEFAULT true,
    watch_issues BOOLEAN DEFAULT false,
    watch_pull_requests BOOLEAN DEFAULT false,
    watch_pushes BOOLEAN DEFAULT false,
    watch_security_alerts BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_source_id)
);
```

### events
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    github_event_id VARCHAR(255) DEFAULT '',        -- GitHubのイベントID（重複防止）
    event_type VARCHAR(50) NOT NULL,                -- 'release', 'issue', 'pull_request', 'push', 'security_alert'
    title VARCHAR(500) NOT NULL,
    body TEXT DEFAULT '',
    html_url TEXT DEFAULT '',
    actor_login VARCHAR(255) DEFAULT '',            -- イベントを実行したユーザー
    actor_avatar_url TEXT DEFAULT '',
    version VARCHAR(50) DEFAULT '',                 -- リリースバージョン
    severity VARCHAR(20) DEFAULT '',                -- セキュリティアラートの重要度等
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_source_id, github_event_id, event_type)
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10),                           -- 表示言語（デフォルトなし）
    email_notifications BOOLEAN,                    -- メール通知（デフォルトなし）
    digest_frequency VARCHAR(20),                   -- 'daily', 'weekly', 'none'（デフォルトなし）
    timezone VARCHAR(50),                           -- タイムゾーン（デフォルトなし）
    theme VARCHAR(20),                              -- 'light', 'dark', 'system'（デフォルトなし）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

### bookmarks
```sql
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bookmark_type VARCHAR(20) NOT NULL,             -- 'event', 'data_source'
    target_id UUID NOT NULL,                        -- event_id or data_source_id
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bookmark_type, target_id)
);
```

### notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    message TEXT DEFAULT '',
    notification_type VARCHAR(50) NOT NULL,         -- 'email', 'in_app'
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## インデックス設計

### パフォーマンス最適化のためのインデックス
```sql
-- users
CREATE INDEX idx_users_auth0_user_id ON users(auth0_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_username ON users(github_username);

-- data_sources
CREATE INDEX idx_data_sources_type ON data_sources(source_type);
CREATE INDEX idx_data_sources_source_id ON data_sources(source_id);
CREATE INDEX idx_data_sources_last_activity ON data_sources(last_activity_at);

-- repositories
CREATE INDEX idx_repositories_data_source_id ON repositories(data_source_id);
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_owner ON repositories(owner);

-- user_watches
CREATE INDEX idx_user_watches_user_id ON user_watches(user_id);
CREATE INDEX idx_user_watches_data_source_id ON user_watches(data_source_id);

-- events
CREATE INDEX idx_events_data_source_id ON events(data_source_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_github_event_id ON events(github_event_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- bookmarks
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_type_target ON bookmarks(bookmark_type, target_id);
```

## 関係性

### 1対1の関係
- data_sources ↔ repositories (1データソースは1つのGitHubリポジトリ)
- users ↔ user_preferences (1ユーザーは1つの設定)

### 1対多の関係
- data_sources → user_watches (1データソースは複数のユーザーに監視される)
- data_sources → events (1データソースは複数のイベントを持つ)
- users → user_watches (1ユーザーは複数のデータソースを監視)
- users → notifications (1ユーザーは複数の通知を受信)
- events → notifications (1イベントは複数の通知を生成可能)

### 多対多の関係
- users ↔ data_sources (user_watchesテーブル経由)

## データ整合性制約

1. **外部キー制約**: 参照整合性を保証
2. **UNIQUE制約**: 重複データの防止
3. **NOT NULL制約**: 必須フィールドの保証
4. **DEFAULT値**: 適切なデフォルト値の設定
5. **CHECK制約**: data_sources.source_typeは定義済みの値のみ許可

## セキュリティ考慮事項

1. **アクセストークンの管理**: GitHubアクセストークンはDBに保存せず、Auth0経由での認証を検討
2. **プライベートリポジトリ**: TODO - プライベートリポジトリの監視方法を検討（Auth0 GitHub連携活用等）
3. **索引の最適化**: 個人情報を含むカラムのインデックスは最小限に
4. **データ保持期間**: 古いイベントや通知の自動削除機能の検討

## 拡張性考慮事項

1. **JSON型の活用**: 慎重に検討して採用。まずは標準的なカラム設計を優先し、真に必要な場合のみJSONを検討
2. **ソース追加の容易性**: 新しいデータソース（NPM、Docker Hub、PyPI等）の追加が容易
3. **パーティショニング**: 将来的にeventsテーブルの日付ベースパーティショニング
4. **読み取り専用レプリカ**: 分析クエリ用の読み取り専用インスタンス検討
5. **UUIDv7**: より効率的なUUID生成方式の採用検討

## データソース別の特徴

### GitHub Repository（現在実装対象）
- source_type: 'github_repository'
- source_id: 'owner/repo'
- repositories テーブルに詳細情報を格納
- イベント: release, issue, pull_request, push, security_alert

### 将来の拡張候補

#### NPM Package（将来実装予定）
- source_type: 'npm_package'  
- source_id: 'package-name'
- packages テーブルに詳細情報を格納
- イベント: npm_publish, security_alert

#### その他の検討候補
- Docker Hub
- PyPI
- Rust Crates
- Go Modules