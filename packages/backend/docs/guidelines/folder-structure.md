# フォルダ構成ガイドライン

## ステータス

決定済み

## コンテキスト

TypeScript + Hono + Drizzle で構成されたAPIサーバーにおいて、機能の複雑化とチーム開発に対応できるフォルダ構成を確立する必要がある。

### 主要な課題

- 機能が増加した際のスケーラビリティ確保
- チーム開発での並行作業の促進
- 責任の明確化と保守性の向上
- テストの配置とコロケーション原則の採用

## 決定

### 採用するアプローチ

**Features-First Approach（機能優先アプローチ）**

コロケーションを意識し、機能単位でコードを整理する。技術層よりも機能単位での分割を優先し、関連するコードを物理的に近い場所に配置する。

### 推奨フォルダ構成

```
packages/backend/src/
├── app.ts                    # 共通Honoアプリケーション定義
├── lambda.ts                 # Lambda用エントリポイント
├── server.ts                 # ECS用HTTPサーバーエントリポイント
├── index.ts                  # デフォルトエクスポート（Lambda）
├── features/                 # 機能単位の実装
│   ├── auth/                # 認証機能
│   │   ├── services/        # 機能別サービス
│   │   │   ├── auth-token.service.ts      # トークン管理
│   │   │   ├── auth-validation.service.ts # 認証検証
│   │   │   ├── auth-session.service.ts    # セッション管理
│   │   │   └── __tests__/   # サービス層テスト
│   │   │       ├── auth-token.service.test.ts
│   │   │       ├── auth-validation.service.test.ts
│   │   │       └── auth-session.service.test.ts
│   │   ├── repositories/
│   │   │   └── auth.repository.ts
│   │   ├── presentation/
│   │   │   ├── routes/      # 機能別ルート
│   │   │   │   ├── login/
│   │   │   │   │   └── index.ts    #ルートに関するスキーマ定義、ルート定義、エンドポイント実装を一箇所に配置。URL末尾が"/"以外の場合はindex.ts以外の名前でファイル作成
│   │   │   │   └── some/
│   │   │   │       └── action1.ts
│   │   │   ├── routes.ts    # メインルート統合ファイル
│   │   │   └── shared/      # 共通コンポーネント
│   │   ├── schemas/         # Zodスキーマ定義
│   │   ├── parsers/         # データ変換処理
│   │   ├── errors/          # カスタムエラークラス
│   │   ├── utils/           # ユーティリティ関数
│   │   └── domain/          # ドメインモデル（必要に応じて）
│   ├── user/                # ユーザー管理
│   ├── data-source/          # データソース管理（GitHubリポジトリ等）
│   └── common/              # 機能横断的なコード
│       ├── logging/
│       └── monitoring/
├── shared/                  # 共通ユーティリティ
│   ├── middleware/          # カスタムミドルウェア
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── error.ts
│   │   └── __tests__/       # ミドルウェアテスト
│   └── utils/               # ヘルパー関数
│       ├── encryption.ts
│       ├── validation.ts
│       └── __tests__/       # ユーティリティテスト
└── db/                      # データベース関連
    ├── connection.ts        # DB接続設定
    ├── schema.ts            # Drizzleスキーマ定義
    └── migrations/          # マイグレーションファイル
```

## 設計思想

### 機能別サービス分割の採用理由

従来の単一`services.ts`ファイルは、機能が複雑になると以下の問題が発生する：

- **ファイルサイズの肥大化**（500行以上になりがち）
- **責任の混在**（認証・プロフィール・通知が一つのクラスに）
- **テストの複雑化**（単一ファイルで多数の機能をテスト）
- **並行開発の困難**（複数人で同じファイルを編集）

### 採用した解決策

1. **機能別サービス分割**: 責任を明確に分離
2. **presentation層の導入**: ルートとスキーマを分離
3. **repositories複数化**: 関連エンティティごとに分割
4. **テスト構造の改善**: フォルダ単位でのテスト整理

### 各層の責務

- **services/**: 特定の機能に特化したビジネスロジック
- **repositories/**: データアクセス層（1テーブル1リポジトリ原則）
- **presentation/**: HTTP層（ルート・バリデーション）
- **types.ts**: その機能固有の型定義
- **tests**: 各層のコロケーションテスト

## フォルダとファイルの命名規則

### 機能名の命名規則

**重要**: 機能フォルダは単数形を使用する（例: `features/user/`, `features/auth/`）

- **単一語**: `auth`, `user`, `order`
- **複数語**: `data-source`, `user-preference`, `order-history`
- **頭字語**: 小文字で統一 `api`, `dto`, `jwt`

### フォルダ内構成の原則

```
features/[機能名]/     # 機能名は単数形（user, auth, dataSource等）
├── services/          # ビジネスロジック
│   └── __tests__/     # テスト(.tsファイルと同じ階層に__tests__フォルダを作成する)
├── repositories/      # データアクセス
├── presentation/      # HTTP層
│   ├── routes/        # 機能別ルート（index.ts に機能単位で実装）
│   │   ├── [feature]/
│   │   │   ├── index.ts    # ルート定義とエンドポイント実装を一箇所に配置
│   │   │   └── schemas.ts  # 該当機能のスキーマ定義
│   │   └── ...
│   ├── routes.ts      # メインルート統合ファイル
│   └── shared/        # 共通コンポーネント
├── schemas/           # Zodスキーマ定義
├── parsers/           # データ変換処理
├── errors/            # カスタムエラークラス
├── utils/             # ユーティリティ関数
└── domain/            # ドメインモデル（必要に応じて）
```

## 利点と注意点

### ✅ 新構造の利点

1. **責任の明確化**

   - 各サービスが単一の責任を持つ（Single Responsibility Principle）
   - プロフィール管理と通知機能の混在を避ける

2. **並行開発の促進**

   - 複数人が異なるファイルで作業可能
   - マージコンフリクトの軽減

3. **テストの改善**

   - 機能単位でのテスト分離
   - モックの簡略化

4. **保守性の向上**
   - 特定機能の変更時の影響範囲を限定
   - コードの理解しやすさ

### ⚠️ 注意すべき点

1. **過度な分割の回避**

   - 100行未満の小さな機能は統合を検討
   - 機能的結合度を保つ

2. **依存関係の管理**

   - サービス間の循環依存を避ける
   - 依存性注入パターンの一貫性

3. **テスト戦略の調整**
   - 統合テストでのサービス間連携確認
   - モックと実装のバランス

## 段階的移行戦略

既存のコードがある場合の移行手順：

1. **Phase 1**: presentation層の分離（routes.ts → presentation/routes.ts）
2. **Phase 2**: サービスの機能別分割
3. **Phase 3**: リポジトリの分割
4. **Phase 4**: テスト構造の改善

## デプロイ対応

### マルチエントリポイント設計

ECSとLambda両方で動作するよう、以下の構成を採用：

```typescript
// src/app.ts - 共通アプリケーション
// src/lambda.ts - Lambda用エントリポイント
// src/server.ts - ECS用HTTPサーバー
// src/index.ts - デフォルトエクスポート（Lambda）
```

## 関連資料

- [ファイル命名規則](./file-naming-conventions.md)
- [アーキテクチャパターン](./architecture-patterns.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
- [テスト戦略](./testing-strategy.md)
