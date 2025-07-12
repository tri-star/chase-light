# CHASE-56: DataSource詳細API実装計画

## 概要

CHASE-56の未完了機能として、DataSource詳細APIを実装します。
ユーザーが特定のDataSourceの詳細情報を取得できるAPIを提供します。

## 実装日時

- **作成日**: 2025-07-11
- **実装者**: Claude Code
- **対応課題**: CHASE-56
- **関連ブランチ**: feat/CHASE-56-data-source-detail-api

## 機能仕様

### 1. APIエンドポイント

```
GET /data-sources/{id}
```

### 2. 認証・認可

- **認証**: JWT認証必須
- **認可**: 認証ユーザーがWatch中のDataSourceのみアクセス可能
- **セキュリティ**: 他ユーザーのDataSourceへのアクセスは404エラーで拒否

### 3. パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| `id` | string (UUID) | ○ | データソースID |

### 4. レスポンス仕様

#### 正常レスポンス（200）

```json
{
  "success": true,
  "data": {
    "dataSource": {
      "id": "uuid",
      "sourceType": "github",
      "sourceId": "123456789",
      "name": "React",
      "description": "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      "url": "https://github.com/facebook/react",
      "isPrivate": false,
      "createdAt": "2024-07-08T10:00:00.000Z",
      "updatedAt": "2024-07-08T10:00:00.000Z"
    },
    "repository": {
      "id": "uuid",
      "dataSourceId": "uuid",
      "githubId": 10270250,
      "fullName": "facebook/react",
      "owner": "facebook",
      "language": "JavaScript",
      "starsCount": 230000,
      "forksCount": 47000,
      "openIssuesCount": 1500,
      "isFork": false,
      "createdAt": "2024-07-08T10:00:00.000Z",
      "updatedAt": "2024-07-08T10:00:00.000Z"
    },
    "userWatch": {
      "id": "uuid",
      "userId": "uuid",
      "dataSourceId": "uuid",
      "notificationEnabled": true,
      "watchReleases": true,
      "watchIssues": false,
      "watchPullRequests": false,
      "addedAt": "2024-07-08T10:00:00.000Z"
    }
  }
}
```

#### エラーレスポンス

- **400 Bad Request**: 不正なIDパラメータ（UUID形式でない等）
- **401 Unauthorized**: 認証エラー
- **404 Not Found**: DataSourceが存在しない、またはユーザーがWatch対象外
- **500 Internal Server Error**: サーバーエラー

## 実装方針

### 1. アーキテクチャ

既存のDataSource管理APIと同じアーキテクチャパターンを踏襲：

- **Domain層**: 既存の型定義を活用（`DataSourceListItem`）
- **Repository層**: データアクセス（詳細取得メソッドの追加）
- **Service層**: ビジネスロジック（新規`DataSourceDetailService`）
- **Presentation層**: API定義（既存ルートファイルの拡張）

### 2. データ取得戦略

#### 既存資産の活用

既存の一覧取得APIで使用している`DataSourceListItem`型を活用：
- `dataSource: DataSource`
- `repository: Repository`（ownerフィールド含む）  
- `userWatch: UserWatch`

#### 権限チェック方式

セキュリティを重視し、以下の方式で権限チェックを実施：
1. ユーザーIDとDataSourceIDの組み合わせで`userWatches`テーブルを検索
2. レコードが存在する場合のみ詳細情報を返却
3. 存在しない場合は404エラーで統一（情報漏洩防止）

### 3. データベース設計

#### 主要なテーブル

- `dataSources`: データソース基本情報
- `repositories`: GitHubリポジトリ固有情報
- `userWatches`: ユーザーのWatch設定（権限チェック用）

#### クエリ戦略

```sql
SELECT 
  ds.*,
  r.*,
  uw.*
FROM dataSources ds
INNER JOIN repositories r ON ds.id = r.dataSourceId
INNER JOIN userWatches uw ON ds.id = uw.dataSourceId
WHERE ds.id = ? AND uw.userId = ?
```

## 実装詳細

### 1. Repository層

#### ファイル: `data-source.repository.ts`

**新規メソッド追加**:
```typescript
async findByIdWithUserAccess(
  id: string, 
  userId: string
): Promise<DataSourceListItem | null>
```

- 認証ユーザーがWatch中のDataSourceのみ取得
- JOIN クエリで関連情報を一括取得
- 権限がない場合は null を返却

### 2. Service層

#### ファイル: `data-source-detail.service.ts`（新規作成）

**クラス**: `DataSourceDetailService`

**DTOおよび型定義**:
```typescript
export type DataSourceDetailInputDto = {
  dataSourceId: string
  userId: string
}

export type DataSourceDetailOutputDto = DataSourceListItem
```

**主要メソッド**:
```typescript
async execute(input: DataSourceDetailInputDto): Promise<DataSourceDetailOutputDto>
```

**エラーハンドリング**:
- DataSourceが見つからない場合: カスタムエラーを投げる
- サービス層では具体的なエラー情報を保持
- Presentation層で適切なHTTPステータスコードに変換

### 3. Presentation層

#### ファイル: `routes/data-sources/index.ts`（拡張）

**新規ルート追加**:
```typescript
GET /{id}
```

**Zodスキーマ**:
- パラメータ: UUID形式のバリデーション
- レスポンス: 既存の`DataSourceListItem`のスキーマを活用

#### ファイル: `schemas/data-source-detail-*.schema.ts`（新規作成）

レスポンススキーマを専用で定義（リクエストスキーマは一覧と共有）

## 実装ファイル一覧

### 新規作成

1. **`data-source-detail.service.ts`**
   - メインのビジネスロジック実装

2. **`data-source-detail.service.test.ts`**
   - サービス層のユニットテスト

3. **`schemas/data-source-detail-response.schema.ts`**
   - 詳細API専用のレスポンススキーマ

4. **`docs/task-logs/CHASE-56/data-source-detail-api-plan.md`**
   - 本実装計画書

### 更新対象

1. **`data-source.repository.ts`**
   - `findByIdWithUserAccess()`メソッド追加

2. **`data-source.repository.test.ts`**
   - 新メソッドのテスト追加

3. **`routes/data-sources/index.ts`**
   - GET /{id} エンドポイント追加

4. **`routes/data-sources/__tests__/index.test.ts`**
   - 詳細APIのテスト追加

5. **`schemas/index.ts`**
   - 新スキーマのエクスポート追加

6. **`services/index.ts`**
   - 新サービスのエクスポート追加

## 実装手順

### Phase 1: 準備作業 ✅
1. [x] ブランチ作成: feat/CHASE-56-data-source-detail-api
2. [x] 作業ログ作成

### Phase 2: Repository層
3. [ ] `findByIdWithUserAccess` メソッド実装
4. [ ] Repository層ユニットテスト実装

### Phase 3: Service層
5. [ ] `DataSourceDetailService` 実装
6. [ ] Service層ユニットテスト実装

### Phase 4: Presentation層
7. [ ] ルート定義とZodスキーマ追加
8. [ ] 統合テスト実装

### Phase 5: 最終確認
9. [ ] 全テスト実行・動作確認
10. [ ] コミット・PR作成

## 考慮事項

### セキュリティ

- **アクセス制御**: userWatchesテーブルでの厳密な権限チェック
- **情報漏洩防止**: 存在しないIDと権限なしIDで同じ404エラー
- **パラメータ検証**: UUID形式の厳密なバリデーション

### パフォーマンス

- **クエリ最適化**: 単一JOINクエリでの一括取得
- **インデックス活用**: 既存の複合インデックスを活用
- **N+1問題回避**: 関連テーブルの事前結合

### 拡張性

- **型の再利用**: 既存`DataSourceListItem`型の活用
- **エラーハンドリング**: 統一されたエラー処理パターン
- **スキーマ設計**: OpenAPI仕様との完全統合

## 進捗状況

- [x] 実装計画策定・ブランチ作成
- [ ] Repository層実装
- [ ] Service層実装  
- [ ] Presentation層実装
- [ ] テスト完了
- [ ] 動作確認完了

## 備考

- 既存の一覧取得APIとの設計統一を最優先
- CQRS原則に沿った責任分離の維持
- パフォーマンス・セキュリティの両立
- 将来の機能拡張を考慮した柔軟な設計

## 参考資料

- 既存実装: `packages/backend/src/features/data-sources/`
- 一覧API実装: `docs/task-logs/CHASE-56/data-source-list-api-plan.md`
- API実装ガイド: `packages/backend/docs/guidelines/api-implementation-guide.md`