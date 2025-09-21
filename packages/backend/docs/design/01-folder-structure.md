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
│   │   ├── domain/          # ドメインレベル（エンティティ定義）
│   │   │   ├── auth-session.ts         # セッションエンティティ
│   │   │   ├── auth-token.ts           # トークンエンティティ
│   │   │   └── __tests__/   # ドメインテスト
│   │   │       ├── auth-session.test.ts
│   │   │       └── auth-token.test.ts
│   │   ├── services/        # ビジネスロジック層
│   │   │   ├── auth-token.service.ts      # トークン管理
│   │   │   ├── auth-validation.service.ts # 認証検証
│   │   │   ├── auth-session.service.ts    # セッション管理
│   │   │   └── __tests__/   # サービス層テスト
│   │   │       ├── auth-token.service.test.ts
│   │   │       ├── auth-validation.service.test.ts
│   │   │       └── auth-session.service.test.ts
│   │   ├── repositories/    # データアクセス層
│   │   │   ├── auth-session.repository.ts
│   │   │   ├── auth-token.repository.ts
│   │   │   └── __tests__/
│   │   │       ├── auth-session.repository.test.ts
│   │   │       └── auth-token.repository.test.ts
│   │   ├── presentation/    # HTTP層
│   │   │   ├── routes/      # 機能別ルート
│   │   │   │   ├── login/
│   │   │   │   │   ├── some-action.ts # ルート定義、機能固有スキーマ、エンドポイント実装
│   │   │   │   │   └── index.ts       # URLが/loginの場合のエンドポイント
│   │   │   │   └── some-function/
│   │   │   │       └── action.ts
│   │   │   ├── schemas/     # Controller層共通スキーマ
│   │   │   │   ├── auth-request.schema.ts
│   │   │   │   ├── auth-response.schema.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── auth-request.schema.test.ts
│   │   │   │       └── auth-response.schema.test.ts
│   │   │   ├── routes.ts    # メインルート統合ファイル
│   │   │   └── shared/      # 共通コンポーネント
│   │   ├── parsers/         # データ変換処理
│   │   ├── errors/          # カスタムエラークラス
│   │   └── utils/           # ユーティリティ関数
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

### レイヤードアーキテクチャとZodスキーマ設計

新しいアーキテクチャでは、各レイヤの責任を明確に分離し、Zodスキーマの配置と責任を最適化しています。

#### 従来の問題点

- **スキーマ定義の分散**（複数箇所でバリデーション定義）
- **型安全性の不完全性**（ランタイムとコンパイル時の型不整合）
- **責任の混在**（ドメイン型とHTTP型の混在）
- **保守性の課題**（スキーマ変更時の影響範囲が不明確）

#### 採用した解決策

1. **レイヤ別スキーマ責任**: 各レイヤで明確にスキーマ責任を分離

   - **Domain層**: エンティティの型定義（TypeScriptのtypeのみ、Zodスキーマは定義しない）
   - **Service層**: InputDto/OutputDto型を使用（Zodスキーマは定義しない）
   - **Repository層**: ドメイン型への変換（Zodスキーマは定義しない、Drizzleが担当）
   - **Controller層**: HTTP入出力用Zodスキーマ（@hono/zod-openapi使用）

2. **機能別サービス分割**: 責任を明確に分離
3. **presentation層の最適化**: ルートとスキーマを適切に分離
4. **repositories複数化**: 関連エンティティごとに分割
5. **テスト構造の改善**: フォルダ単位でのテスト整理

### 各層の責務

- **domain/**: ドメインエンティティとその型定義（TypeScriptのtypeのみ、エンティティ関連ロジック）
- **services/**: 特定の機能に特化したビジネスロジック（InputDto/OutputDto型を使用、Zodスキーマは定義しない）
- **repositories/**: データアクセス層（ドメイン型への変換責任）
- **presentation/**: HTTP層（ルート・HTTPスキーマ・バリデーション）
  - **routes/**: 機能別ルート実装（機能固有Zodスキーマを含む）
  - **schemas/**: Controller層共通スキーマ（HTTP入出力用Zodスキーマ）
- **tests**: 各層のコロケーションテスト

## フォルダとファイルの命名規則

### 機能名の命名規則

**重要**: 機能フォルダは単数形を使用する（例: `features/user/`, `features/identity/`）

- **単一語**: `auth`, `user`, `order`
- **複数語**: `data-source`, `user-preference`, `order-history`
- **頭字語**: 小文字で統一 `api`, `dto`, `jwt`

### フォルダ内構成の原則

```
features/[機能名]/     # 機能名は単数形（user, auth, dataSource等）
├── domain/            # ドメインレベル（最優先）
│   ├── [entity].ts    # エンティティ定義（TypeScript typeのみ）
│   └── __tests__/     # ドメインテスト
├── services/          # ビジネスロジック
│   ├── [function].service.ts  # 機能別サービス（InputDto/OutputDto型使用）
│   └── __tests__/     # サービステスト
├── repositories/      # データアクセス
│   ├── [entity].repository.ts # エンティティ別リポジトリ
│   └── __tests__/     # リポジトリテスト
├── presentation/      # HTTP層
│   ├── routes/        # 機能別ルート
│   │   ├── [feature]/
│   │   │   └── index.ts    # ルート定義 + 機能固有Zodスキーマ + エンドポイント実装
│   │   └── ...
│   ├── schemas/       # Controller層共通スキーマ（HTTP入出力用Zodスキーマ）
│   │   ├── [purpose].schema.ts  # 用途別Zodスキーマ
│   │   └── __tests__/
│   ├── routes.ts      # メインルート統合ファイル
│   └── shared/        # 共通コンポーネント
├── parsers/           # データ変換処理
├── errors/            # カスタムエラークラス
└── utils/             # ユーティリティ関数
```

## 利点と注意点

### ✅ 新構造の利点

1. **スキーマ責任の明確化**

   - Domain層でのエンティティ型定義の一元化
   - Controller層でのHTTP入出力スキーマの分離
   - 型安全性とランタイム検証の両立

2. **レイヤ間の責任分離**

   - 各レイヤが明確な責任を持つ（Single Responsibility Principle）
   - ドメインロジックとHTTPロジックの分離

3. **並行開発の促進**

   - 複数人が異なるレイヤ・ファイルで作業可能
   - マージコンフリクトの軽減

4. **テストの改善**

   - レイヤ単位でのテスト分離
   - モックの簡略化
   - ドメインロジックの単体テスト容易性

5. **保守性の向上**
   - 特定機能・レイヤの変更時の影響範囲を限定
   - コードの理解しやすさ
   - スキーマ変更時の影響追跡容易性

### ⚠️ 注意すべき点

1. **過度な分割の回避**

   - 100行未満の小さな機能は統合を検討
   - 機能的結合度を保つ
   - ドメインエンティティの適切な粒度設定

2. **レイヤ間依存関係の管理**

   - レイヤ間の循環依存を避ける
   - 依存性注入パターンの一貫性
   - ドメイン型の適切な参照（下位レイヤから上位レイヤへの参照禁止）

3. **スキーマ設計の一貫性**

   - ドメイン型とHTTP型の適切な分離
   - DTO型の命名規則統一（InputDto, OutputDto）
   - 型変換処理の配置場所の一貫性

4. **テスト戦略の調整**
   - レイヤ単位でのテスト分離
   - 統合テストでのレイヤ間連携確認
   - ドメインロジックの単体テスト充実

## 段階的移行戦略

既存のコードがある場合の移行手順：

1. **Phase 1**: ドメイン層の構築

   - `schemas/` → `domain/` への移行
   - エンティティ型の定義とexport

2. **Phase 2**: presentation層の分離

   - routes.ts → presentation/routes.ts
   - Controller層共通スキーマの整理

3. **Phase 3**: Service層の最適化

   - DTO型の導入
   - Zodスキーマ定義の削除

4. **Phase 4**: Repository層の調整

   - ドメイン型への変換処理追加
   - Drizzle結果からドメイン型への変換

5. **Phase 5**: テスト構造の改善
   - レイヤ別テスト分離
   - ドメインロジックテストの充実

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
