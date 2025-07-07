-- テスト用データベースの作成
-- Vitestテスト実行時に使用される専用データベース
--
-- 使用方法:
-- 1. Docker Compose起動時（自動実行）: docker compose up -d db
-- 2. 手動実行: docker exec -i $(docker ps -q -f "name=postgres") psql -U postgres -d postgres < database/init/00-create-test-database.sql

-- chase_light_test データベースが存在しない場合は作成
SELECT 'CREATE DATABASE chase_light_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chase_light_test')\gexec

-- 作成ログ
\echo 'Test database "chase_light_test" created or already exists'

-- テスト用データベースに接続してユーザー権限を設定
\c chase_light_test

-- postgresユーザーにすべての権限を付与
GRANT ALL PRIVILEGES ON DATABASE chase_light_test TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 将来作成されるテーブル・シーケンスにも権限を付与
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;

\echo 'Test database permissions configured for postgres user'
\echo 'You can now run: pnpm test'

-- 元のデータベースに戻る（Docker初期化時はchase_lightが存在しないためエラーを無視）
\c chase_light 2>/dev/null || \c postgres