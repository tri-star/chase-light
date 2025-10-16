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
    auth0_user_id TEXT UNIQUE NOT NULL,     -- Auth0のuser_id
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    github_username TEXT,  -- GitHubユーザー名(後でPassword認証を導入する可能性があるのでNULL許可)
    timezone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### data_sources

```sql
CREATE TABLE data_sources (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    source_type TEXT NOT NULL,               -- 'github_repository'
    source_id TEXT NOT NULL,                -- GitHubの場合は'owner/repo'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,                               -- データソースのURL
    is_private BOOLEAN NOT NULL,
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
    full_name TEXT NOT NULL,                -- "owner/repo"形式
    language TEXT,             -- 主要プログラミング言語(取得できない可能性がある)
    stars_count INTEGER NOT NULL,                  -- スター数
    forks_count INTEGER NOT NULL,
    open_issues_count INTEGER NOT NULL,
    is_fork BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### user_watches

```sql
CREATE TABLE user_watches (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN NOT NULL,
    watch_releases BOOLEAN NOT NULL,
    watch_issues BOOLEAN NOT NULL,
    watch_pull_requests BOOLEAN NOT NULL,
    watch_pushes BOOLEAN NOT NULL,
    watch_security_alerts BOOLEAN NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_source_id)
);
```

### events

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    github_event_id TEXT NOT NULL,        -- GitHubのイベントID（重複防止）
    event_type TEXT NOT NULL,                -- 'release', 'issue', 'pull_request', 'push', 'security_alert'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    version TEXT,                 -- リリースバージョン(取得できない可能性あり)
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
    email_notifications BOOLEAN NOT NULL,                    -- メール通知（デフォルトなし）
    timezone TEXT,                           -- タイムゾーン（NULL=システム依存）
    theme TEXT NOT NULL,                              -- 'light', 'dark', 'system'
    digest_delivery_times JSONB NOT NULL DEFAULT '["18:00"]'::jsonb, -- ユーザー指定のダイジェスト送信スロット
    digest_timezone TEXT,                             -- ダイジェスト専用のタイムゾーン（未指定時はユーザーのtimezone）
    digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,     -- ダイジェスト配信の有効 / 無効
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
    bookmark_type TEXT NOT NULL,             -- 'event', 'data_source'
    target_id UUID NOT NULL,                        -- event_id or data_source_id
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bookmark_type, target_id)
);
```

### notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,                             -- UUIDv7をアプリケーション側で生成
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,         -- 'activity_digest' を中心に利用
    is_read BOOLEAN NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    status_detail TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, activity_id)
);
```

## インデックス設計

### パフォーマンス最適化のためのインデックス

```sql
-- users
CREATE INDEX idx_users_auth0_user_id ON users(auth0_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_username ON users(github_username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);

-- data_sources
CREATE INDEX idx_data_sources_type ON data_sources(source_type);
CREATE INDEX idx_data_sources_source_id ON data_sources(source_id);
CREATE INDEX idx_data_sources_name ON data_sources(name);              -- 名前でのフィルタリング用
CREATE INDEX idx_data_sources_name_text_ops ON data_sources(name text_pattern_ops);  -- LIKE検索用
CREATE INDEX idx_data_sources_created_at ON data_sources(created_at);
CREATE INDEX idx_data_sources_updated_at ON data_sources(updated_at);

-- repositories
CREATE INDEX idx_repositories_data_source_id ON repositories(data_source_id);
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_stars_count ON repositories(stars_count); -- スター数でのソート・フィルタ用
CREATE INDEX idx_repositories_created_at ON repositories(created_at);
CREATE INDEX idx_repositories_updated_at ON repositories(updated_at);

-- user_watches
CREATE INDEX idx_user_watches_user_id ON user_watches(user_id);
CREATE INDEX idx_user_watches_data_source_id ON user_watches(data_source_id);
CREATE INDEX idx_user_watches_added_at ON user_watches(added_at);

-- activities
CREATE INDEX idx_activities_data_source_id ON activities(data_source_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_title ON activities(title);                        -- タイトルでのフィルタリング用
CREATE INDEX idx_activities_version ON activities(version);                    -- バージョンでのフィルタリング用
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_updated_at ON activities(updated_at);
CREATE INDEX idx_activities_github_event_id ON activities(github_event_id);
CREATE INDEX idx_activities_data_source_type ON activities(data_source_id, activity_type); -- 複合インデックス
CREATE INDEX idx_activities_data_source_created ON activities(data_source_id, created_at); -- 複合インデックス
CREATE INDEX idx_activities_status ON activities(status);

-- user_preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_created_at ON user_preferences(created_at);
CREATE INDEX idx_user_preferences_updated_at ON user_preferences(updated_at);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_activity_id ON notifications(activity_id);    -- アクティビティIDでの検索用
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type); -- 通知タイプでのフィルタ用
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read); -- 複合インデックス
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at); -- 複合インデックス
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);      -- 送信日時でのソート用
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_updated_at ON notifications(updated_at);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_status ON notifications(status);

-- bookmarks
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_target_id ON bookmarks(target_id);           -- ターゲットIDでの検索用
CREATE INDEX idx_bookmarks_type_target ON bookmarks(bookmark_type, target_id);
CREATE INDEX idx_bookmarks_user_type ON bookmarks(user_id, bookmark_type); -- 複合インデックス
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);

```

### インデックス追加の理由

#### 名前・タイトル系フィールドのインデックス追加

- `data_sources.name`: データソース名での検索・フィルタリング
- `activities.title`: アクティビティタイトルでの検索・フィルタリング
- `repositories.full_name`: リポジトリ名での検索（既存）

#### ID系フィールドのインデックス追加

- `user_preferences.user_id`: ユーザー設定の取得時に必要
- `notifications.activity_id`: 特定アクティビティに関する通知の検索
- `bookmarks.target_id`: ブックマーク対象の逆引き検索

#### フィルタリング・ソート用インデックス追加

- `repositories.language`: プログラミング言語でのフィルタリング
- `repositories.stars_count`: スター数でのソート・フィルタリング
- `user_watches.notification_enabled`: 通知有効/無効でのフィルタリング
- `activities.version`: バージョンでのフィルタリング
- `activities.status`: アクティビティ処理状況でのフィルタリング
- `notifications.notification_type`: 通知タイプでのフィルタリング
- `notifications.sent_at`: 送信日時でのソート
- `notifications.scheduled_at`: 配信予定時刻でのソート
- `notifications.status`: 通知処理ステータスでの集計

#### 複合インデックス追加

- `user_watches(user_id, notification_enabled)`: ユーザーの通知有効監視対象取得
- `activities(data_source_id, activity_type)`: データソース別アクティビティ種別検索
- `activities(data_source_id, created_at)`: データソース別時系列検索
- `notifications(user_id, is_read)`: ユーザー別未読通知検索
- `notifications(user_id, created_at)`: ユーザー別通知履歴検索
- `notifications(user_id, activity_id)`: 重複通知生成を防ぐユニーク制約
- `bookmarks(user_id, bookmark_type)`: ユーザー別ブックマークタイプ検索
