# データベーススキーマ設計

## ステータス

決定済み

## コンテキスト

GitHub リポジトリ監視アプリケーションのデータベーススキーマを設計する必要がある。将来的にNPMパッケージなど他のデータソースにも対応したいが、初期実装ではGitHubリポジトリのみに集中する。

### 主要な要件

- 既存のAuth0認証システムとの統合
- ユーザーがGitHubリポジトリを監視できる機能
- リポジトリのイベント（リリース、PR、Issue等）の追跡
- ユーザー設定とブックマーク機能
- 通知システム
- 将来的な拡張性（NPM等の他データソース対応）

## 決定

### アーキテクチャパターン

**Data Sourceパターンの採用**

- 将来のNPM対応を見据え、DataSourceという抽象概念を導入
- GitHubリポジトリ固有の情報は`repositories`テーブルに分離
- 1対1の関係で`data_sources` ↔ `repositories`を設計

### ID管理

**UUIDv7をアプリケーション側で生成**

- PostgreSQLの`gen_random_uuid()`はUUIDv4を生成するため不採用
- より効率的なUUIDv7をアプリケーション側で生成
- テーブル定義では`DEFAULT`値なし

### デフォルト値戦略

アプリケーション側でカラム名を指定し忘れたまま、メンテされていないDBのカラム上のデフォルト値が代入されるなどの問題を避けるため、以下の場合を除き、デフォルト値はテーブル定義上では設定しない。

- `created_at`、`updated_at`カラムで`CURRENT_TIMESTAMP`をデフォルト値とする時

### カラムをNOT NULLとするかどうか

全般的に、そのカラムに「値がない」ことと「値が空である」ことを区別する必要がある場合、NULLを許可する。
そうでない場合はNOT NULLとする。

- 文字列型:
  - 空文字（`''`）が値としてあり得る場合: `NULL`を許可
  - 空文字が値としてあり得ない場合: `NOT NULL`
- 数値型:
  - `0`が意味を持つ場合: `NOT NULL`
  - `NULL`が適切な場合: `NULL`を許可
- 日付型:
  - `CURRENT_TIMESTAMP`をデフォルト値とする場合: `NOT NULL`
  - 日付がない可能性がある場合: `NULL`を許可

NULLが可能なカラムのデフォルト値をNULLとする場合、「何も指定しない」ことによりデフォルトでNULLが設定されるようにする。

### レコードの登録日・更新日

データを調査する役に立つため、基本的に各テーブルに`created_at`と`updated_at`カラムを追加する。

DELETE+INSERTのようなオペレーションで管理する中間テーブルでupdated_atが意味をなさない場合は `updated_at` は省略可能

### セキュリティ方針

**アクセストークンの非保存**

- GitHubアクセストークンはDBに保存しない
- Auth0経由での認証を検討
- プライベートリポジトリ対応は将来のTODO

### データ型選択

**文字列型**

可変長文字列 = TEXT型を使用する

**文字列型**

**JSON型の慎重な活用**

- まずは標準的なカラム設計を優先
- 真に必要な場合のみJSONを検討
- 初期実装では極力避ける

## 考慮した選択肢

### ID生成方式

#### PostgreSQL側でのUUID生成

- `gen_random_uuid()`はUUIDv4を生成
- ソート性能が劣るため不採用

#### アプリケーション側でのUUID生成

- UUIDv7の採用でソート性能を改善
- アプリケーション側で一意性管理
- 採用

### データソース設計

#### 単一テーブルでの管理

- GitHubとNPMの情報を一つのテーブルで管理
- カラムの無駄が多く、拡張性に劣る

#### DataSourceパターン

- 抽象的な`data_sources`テーブル
- 具体的な`repositories`、`packages`テーブル
- 拡張性が高く採用

### アクセストークン管理

#### データベースでの暗号化保存

- セキュリティリスクが高い
- 管理コストが高い

#### Auth0経由での管理

- セキュリティリスクを軽減
- 実装コストは高いが長期的にメリット大
- 採用

## 結果・影響

### ポジティブな影響

- **拡張性**: 新しいデータソース（NPM、Docker Hub等）の追加が容易
- **セキュリティ**: アクセストークンを直接保存しないことでリスク軽減
- **パフォーマンス**: UUIDv7によるソート性能の改善
- **保守性**: 明確な関係性とデータ分離

### 考慮事項

- **実装複雑性**: DataSourceパターンにより初期実装が複雑化
- **パフォーマンス**: JOIN操作の増加
- **データ整合性**: 複数テーブル間の整合性管理が必要

### 今後の対応

1. **短期（現在のフェーズ）**

   - GitHub リポジトリ監視機能の実装
   - Drizzle ORMでのスキーマ実装
   - 基本的なCRUD操作の実装

2. **中期（機能拡張フェーズ）**

   - パフォーマンス最適化
   - インデックス戦略の見直し
   - Auth0 GitHub連携の実装

3. **長期（スケール対応）**
   - NPMパッケージ対応
   - パーティショニング戦略
   - 読み取り専用レプリカの検討

## 実装方針

### テーブル構成

1. **users**: ユーザー情報（Auth0連携）
2. **data_sources**: データソース抽象管理
3. **repositories**: GitHubリポジトリ詳細
4. **user_watches**: ユーザー監視設定（多対多）
5. **events**: リポジトリイベント
6. **user_preferences**: ユーザー設定
7. **bookmarks**: ブックマーク機能
8. **notifications**: 通知履歴

### 関係性

- **1対1**: `data_sources` ↔ `repositories`、`users` ↔ `user_preferences`
- **1対多**: 各親テーブルから子テーブルへ
- **多対多**: `users` ↔ `data_sources`（`user_watches`経由）

### インデックス戦略

- 外部キーカラム
- 検索頻度の高いカラム（email、github_username等）
- 日付カラム（created_at、last_activity_at等）
- 複合インデックス（bookmark_type + target_id等）

## 参考資料

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL UUID Functions](https://www.postgresql.org/docs/current/functions-uuid.html)
- [Auth0 Best Practices](https://auth0.com/docs/best-practices)
- [Database Design Patterns](https://www.martinfowler.com/articles/dblogic.html)
