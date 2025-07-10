# CHASE-56: DataSource一覧取得API実装計画

## 概要

CHASE-56の一環として、DataSource一覧取得APIを実装します。
ユーザーがWatch中のDataSourceを豊富なフィルタリング・検索・ソート機能付きで取得できるAPIを提供します。

## 実装日時

- **作成日**: 2025-07-09
- **実装者**: Claude Code
- **対応課題**: CHASE-56

## 機能仕様

### 1. APIエンドポイント

```
GET /data-sources
```

### 2. 認証

- JWT認証必須
- 認証されたユーザーのWatch対象DataSourceのみ取得可能

### 3. クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|---|------|-----------|------|
| `name` | string | × | - | データソース名での部分一致検索 |
| `owner` | string | × | - | GitHubオーナー名での部分一致検索 |
| `search` | string | × | - | フリーワード検索（name, description, url, fullName対象） |
| `sourceType` | string | × | - | データソースタイプ（github, npm等） |
| `isPrivate` | boolean | × | - | プライベート/パブリック絞り込み |
| `language` | string | × | - | プログラミング言語での絞り込み |
| `createdAfter` | string | × | - | 登録日（これ以降）ISO8601形式 |
| `createdBefore` | string | × | - | 登録日（これ以前）ISO8601形式 |
| `updatedAfter` | string | × | - | 更新日（これ以降）ISO8601形式 |
| `updatedBefore` | string | × | - | 更新日（これ以前）ISO8601形式 |
| `sortBy` | string | × | createdAt | ソート基準（name, createdAt, updatedAt, addedAt, starsCount） |
| `sortOrder` | string | × | desc | ソート順（asc, desc） |
| `page` | number | × | 1 | ページ番号（1ベース） |
| `perPage` | number | × | 20 | 1ページあたりの件数（1-100） |

### 4. レスポンス仕様

#### 正常レスポンス（200）

```json
{
  "success": true,
  "data": {
    "items": [
      {
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
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### エラーレスポンス

- **401 Unauthorized**: 認証エラー
- **400 Bad Request**: 不正なパラメータ
- **500 Internal Server Error**: サーバーエラー

## 実装方針

### 1. アーキテクチャ

既存のDataSource登録APIと同じアーキテクチャパターンを踏襲し、CQRS的な設計を採用：
- **Domain層**: 型定義（CQRSのQuery側専用型も含む）
- **Repository層**: データアクセス
- **Service層**: ビジネスロジック
- **Presentation層**: API定義

### 2. CQRS設計の採用

#### 設計判断の理由
データソース一覧取得は、既存のCRUD操作とは異なる要求を持つため、CQRS（Command Query Responsibility Segregation）的なアプローチを採用しました。

#### 新しいドメイン型の定義

**新規ファイル**: `domain/data-source-list.ts`

```typescript
// 検索結果用のリポジトリ型（ownerフィールドを追加）
export type DataSourceListRepository = Repository & {
  owner: string // fullNameから抽出したオーナー名
}

// 検索結果用の複合型（CQRS Query側）
export type DataSourceListItem = {
  dataSource: DataSource
  repository: DataSourceListRepository
  userWatch: UserWatch
}

// 検索結果とページネーション情報
export type DataSourceListResult = {
  items: DataSourceListItem[]
  total: number
}

// 検索フィルター型
export type DataSourceListFilters = {
  name?: string
  owner?: string
  search?: string
  // ... その他のフィルター
}
```

#### 設計上の利点

1. **責任分離**: 検索専用の型により、CRUDと検索の責任が明確に分離
2. **拡張性**: 将来的に検索結果に追加情報が必要になった場合に対応しやすい
3. **型安全性**: 検索結果専用の型により、コンパイル時の型チェックが強化
4. **利便性**: `owner`フィールドの追加により、フロントエンドでの使用が容易

### 3. データベース設計

#### 主要なテーブル

- `dataSources`: データソース基本情報
- `repositories`: GitHubリポジトリ固有情報
- `userWatches`: ユーザーのWatch設定

#### JOIN戦略

```sql
SELECT 
  ds.*,
  r.*,
  uw.*
FROM dataSources ds
INNER JOIN repositories r ON ds.id = r.dataSourceId
INNER JOIN userWatches uw ON ds.id = uw.dataSourceId
WHERE uw.userId = ?
```

### 4. フィルタリング実装

#### 動的WHERE条件

- `name`: `ds.name ILIKE %?%`
- `owner`: `SPLIT_PART(r.fullName, '/', 1) ILIKE %?%`
- `search`: `(ds.name ILIKE %?% OR ds.description ILIKE %?% OR ds.url ILIKE %?% OR r.fullName ILIKE %?%)`
- `sourceType`: `ds.sourceType = ?`
- `isPrivate`: `ds.isPrivate = ?`
- `language`: `r.language = ?`
- `createdAfter`: `ds.createdAt >= ?`
- `createdBefore`: `ds.createdAt <= ?`
- `updatedAfter`: `ds.updatedAt >= ?`
- `updatedBefore`: `ds.updatedAt <= ?`

#### ソート実装

- `name`: `ds.name`
- `createdAt`: `ds.createdAt`
- `updatedAt`: `ds.updatedAt`
- `addedAt`: `uw.addedAt`
- `starsCount`: `r.starsCount`

### 5. パフォーマンス最適化

#### インデックス活用

- 既存のインデックスを活用
- 必要に応じて複合インデックスの検討

#### ページネーション

- `LIMIT`/`OFFSET`による実装
- 将来的にカーソルベースページネーションの検討

## 実装ファイル

### 新規作成

1. **`data-source-list-request.schema.ts`**
   - クエリパラメータのZodスキーマ定義

2. **`data-source-list-response.schema.ts`**
   - レスポンス形式のZodスキーマ定義

3. **`data-source-list.service.ts`**
   - ビジネスロジック実装

4. **`data-source-list.service.test.ts`**
   - サービス層のユニットテスト

### 更新

1. **`data-source.repository.ts`**
   - `findByUserWithFilters()`メソッド追加

2. **`routes/data-sources/index.ts`**
   - GET /data-sources エンドポイント追加

3. **`routes/data-sources/__tests__/index.test.ts`**
   - エンドポイントのテスト追加

## 実装手順

### Phase 1: 設計・計画 ✅
1. [x] 作業ログ作成
2. [ ] リクエストスキーマ定義
3. [ ] レスポンススキーマ定義

### Phase 2: データアクセス層
4. [ ] データベーススキーマ分析
5. [ ] リポジトリメソッド実装
6. [ ] リポジトリテスト実装

### Phase 3: ビジネスロジック層（相談タイミング）
7. [ ] サービス実装
8. [ ] サービステスト実装

### Phase 4: プレゼンテーション層
9. [ ] APIルート実装
10. [ ] APIテスト実装

### Phase 5: 動作確認
11. [ ] 手動テスト
12. [ ] パフォーマンステスト

## 考慮事項

### セキュリティ

- JWT認証による認可
- SQLインジェクション対策（Drizzle ORM使用）
- パラメータ検証（Zod使用）

### パフォーマンス

- インデックス活用
- 効率的なJOINクエリ
- 適切なページネーション

### 拡張性

- 新データソースタイプ対応
- フィルタ条件追加
- ソート軸追加

## 進捗状況

- [x] 実装計画策定
- [ ] 実装開始
- [ ] 実装完了
- [ ] テスト完了
- [ ] 動作確認完了

## 備考

このファイルは実装過程で適宜更新され、進捗状況や発生した問題、解決策などを記録するために使用されます。