# ファイル命名規則

## ステータス

決定済み

## コンテキスト

TypeScriptプロジェクトでのファイル命名規則について、一貫性のある方針を確立する必要がある。特にbackendプロジェクトにおいて、機能別フォルダ構成との整合性を保ちながら、開発チームが迷わずにファイルを作成・管理できる明確な命名規則が求められる。

現在、TypeScriptコミュニティでは複数の命名パターンが混在しており、フレームワークやプロジェクトによって異なるアプローチが採用されている。

### 主要な課題

- チーム内でのファイル命名の一貫性確保
- 新しいメンバーがプロジェクト構造を理解しやすくする
- IDEでのファイル検索・操作性の向上
- 異なるOS・ファイルシステムでの互換性確保
- 大規模プロジェクトでのファイル管理の効率化

## 決定

### 採用する命名規則

**Option 1: kebab-case.layer.ts パターンを採用**

```
user-profile.service.ts
auth-token.service.ts
data-source.repository.ts
user-preference.repository.ts
auth.middleware.ts
user.controller.ts
```

### フォルダ構造との組み合わせ

機能別フォルダ内で、さらにレイヤ別フォルダを挟む構造：

```
features/user/
├── services/
|   |── __tests__/
|   |   ├── user-profile.service.test.ts
|   |   ├── auth-token.service.test.ts
|   |   └── user-preference.service.test.ts
│   ├── user-profile.service.ts
│   ├── user-preference.service.ts
│   └── user-notification.service.ts
├── repositories/
│   ├── user.repository.ts
│   └── user-preference.repository.ts
├── presentation/
│   ├── routes/
│   │   ├── profile/
│   │   │   ├── index.ts      # 機能単位でルート定義とエンドポイント実装をまとめて配置
│   │   │   └── schemas.ts
│   │   └── settings/
│   │       ├── index.ts
│   │       └── schemas.ts
│   ├── routes.ts             # メインルート統合
│   └── shared/
│       ├── common-schemas.ts
│       └── error-handling.ts
```

### クラス名との対応関係

```typescript
// ファイル名: user-profile.service.ts
export class UserProfileService {}

// ファイル名: auth-token.service.ts
export class AuthTokenService {}

// ファイル名: data-source.repository.ts
export class DataSourceRepository {}
```

## 考慮した選択肢

### Option 1: kebab-case.layer.ts（採用）

```
user-profile.service.ts
auth-token.service.ts
data-source.repository.ts
```

**採用フレームワーク**: Angular、NestJS、一部のNext.js

**利点**:

- 業界標準として確立されている
- レイヤの役割が即座に識別可能
- クロスプラットフォーム互換性が高い
- NPMエコシステムとの整合性
- 複数語の組み合わせが読みやすい

**欠点**:

- ファイル名が長くなる傾向

### Option 2: PascalCase.ts

```
UserProfileService.ts
AuthTokenService.ts
DataSourceRepository.ts
```

**採用例**: React多め、一部のNext.js

**利点**:

- クラス名とファイル名が一致する
- 簡潔で分かりやすい

**欠点**:

- レイヤの識別が困難
- 大文字小文字を区別しないファイルシステムで問題
- NPMパッケージ命名規則と不整合

### Option 3: camelCase.ts

```
userProfileService.ts
authTokenService.ts
dataSourceRepository.ts
```

**採用例**: 古いJS慣習、個人プロジェクト

**利点**:

- JavaScriptの変数命名と一致

**欠点**:

- モダンなTypeScriptプロジェクトでは非推奨
- レイヤの識別が困難
- 可読性に劣る

### Option 4: フォルダ分割 + 役割.ts

```
user-profile/
├── service.ts
├── repository.ts
└── controller.ts
```

**採用例**: Clean Architecture重視プロジェクト

**利点**:

- 機能単位での完全な分離
- ファイル名が簡潔

**欠点**:

- フォルダ数の爆発的増加
- IDE操作時の階層の深さ
- 同名ファイルが多数発生し混乱の原因

## 採用理由

### 1. **業界標準への準拠**

Angular（2016年～）とNestJS（2017年～）が確立した命名規則で、エンタープライズ開発において広く採用されている。特にバックエンドAPIサーバーの開発においては事実上の標準となっている。

### 2. **アーキテクチャの可視化**

ファイル名から即座にその役割（service, repository, controller等）が判別でき、プロジェクトのアーキテクチャ構造を理解しやすい。新しいメンバーのオンボーディングが効率化される。

### 3. **技術的互換性**

- **クロスプラットフォーム**: Windows、macOS、Linuxで問題なく動作
- **NPMエコシステム**: パッケージ命名規則（kebab-case必須）との整合性
- **URL互換性**: 将来的にファイル名がURLパスに使用される場合も安全

### 4. **大規模プロジェクトでの管理性**

機能が増加しても、レイヤ別フォルダ＋命名規則により、ファイルの整理・検索が容易。複数人での並行開発時もファイルの役割が明確で作業分担しやすい。

### 5. **ツールサポート**

主要なIDEやエディタで、ファイル名による検索・フィルタリングが効率的に行える。また、ESLintやBiomeなどのリンターでファイル命名規則を強制できる。

## 実装ガイドライン

### ファイル命名パターン

| レイヤ       | パターン                         | 例                             |
| ------------ | -------------------------------- | ------------------------------ |
| Service      | `[機能名].[詳細].service.ts`     | `user-profile.service.ts`      |
| Repository   | `[エンティティ名].repository.ts` | `user.repository.ts`           |
| Controller   | `[機能名].controller.ts`         | `auth.controller.ts`           |
| Middleware   | `[機能名].middleware.ts`         | `auth.middleware.ts`           |
| Entity       | `[エンティティ名].entity.ts`     | `user.entity.ts`               |
| DTO          | `[用途].dto.ts`                  | `create-user.dto.ts`           |
| Interface    | `[名前].interface.ts`            | `user-repository.interface.ts` |
| Type         | `[用途].types.ts`                | `api.types.ts`                 |
| Schema       | `[データ名].schema.ts`           | `repository.schema.ts`         |
| Parser       | `[データソース名].parser.ts`     | `github-api.parser.ts`         |
| Error        | `[用途].error.ts`                | `github-parse.error.ts`        |
| Utils        | `[機能名].ts`                    | `auth-config.ts`               |
| Route        | `index.ts`                       | `routes/profile/index.ts`      |
| Route Schema | `schemas.ts`                     | `routes/profile/schemas.ts`    |

### 機能名の命名規則

- **単一語**: `auth`, `user`, `order`
- **複数語**: `data-source`, `user-preference`, `order-history`
- **頭字語**: 小文字で統一 `api`, `dto`, `jwt`

### フォルダとの組み合わせ

**重要**: 機能フォルダは単数形を使用する（例: `features/user/`, `features/auth/`）

```
features/[機能名]/     # 機能名は単数形（user, auth, dataSource等）
├── services/          # ビジネスロジック
|   └── __tests__/     # テスト(.tsファイルと同じ階層に__tests__フォルダを作成する)
├── repositories/      # データアクセス
├── presentation/      # HTTP層
│   ├── routes/       # 機能別ルート（index.ts に機能単位で実装）
│   │   ├── [feature]/
│   │   │   ├── index.ts    # ルート定義とエンドポイント実装を一箇所に配置
│   │   │   └── schemas.ts  # 該当機能のスキーマ定義
│   │   └── ...
│   ├── routes.ts     # メインルート統合ファイル
│   └── shared/       # 共通コンポーネント
├── schemas/          # Zodスキーマ定義
├── parsers/          # データ変換処理
├── errors/           # カスタムエラークラス
├── utils/            # ユーティリティ関数
└── domain/           # ドメインモデル（必要に応じて）
```

### 新パターン: Zod v4 + Parser Architecture

**背景**: 従来の`as`型キャストによる型安全性の問題を解決するため、Zod v4スキーマ + Parser クラスによるアーキテクチャを採用。

#### スキーマ設計パターン

```typescript
// features/dataSource/schemas/repository.schema.ts
// Core スキーマ（内部ドメインオブジェクト用）
export const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  fullName: z.string().min(1), // camelCase
  // ...
});

// GitHub API スキーマ（外部API固有）
export const githubRepositoryApiSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1), // snake_case
  // ...
});

export type Repository = z.infer<typeof repositorySchema>;
```

#### Parserクラス設計パターン

```typescript
// features/dataSource/parsers/github-api.parser.ts
export class GitHubApiParser {
  static parseRepository(apiData: unknown): Repository {
    try {
      // 1. GitHub APIスキーマでパース
      const githubRepo = githubRepositoryApiSchema.parse(apiData);

      // 2. 内部オブジェクト形式に変換
      const repository: Repository = {
        id: githubRepo.id,
        name: githubRepo.name,
        fullName: githubRepo.full_name, // field name conversion
        // ...
      };

      // 3. 内部スキーマで最終検証
      return repositorySchema.parse(repository);
    } catch (error) {
      throw new GitHubApiParseError("Parse failed", error, apiData);
    }
  }
}
```

#### 利点

- **ランタイム型安全性**: `as`キャストを排除し、実行時型検証を実現
- **データソース独立性**: GitHub API以外（DB、他API等）にも対応可能
- **ビジネスルール検証**: Parser内で業務ルールを検証
- **エラーハンドリング**: 構造化されたパースエラー情報
- **テスタビリティ**: Parser単体でのテストが容易

#### ファイル構成

```
features/dataSource/
├── schemas/                # Zodスキーマ定義（Coreスキーマ + API固有スキーマ）
│   ├── repository.schema.ts
│   ├── pull-request.schema.ts
│   ├── issue.schema.ts
│   └── release.schema.ts
├── parsers/                # データ変換クラス
│   └── github-api.parser.ts
├── errors/                 # カスタムエラークラス
│   ├── github-parse.error.ts
│   └── github-api.error.ts
├── types/                  # 残存する型定義（API Options等）
│   └── api-options.ts
└── services/
    ├── __tests__/     # テスト(.tsファイルと同じ階層に__tests__フォルダを作成する)
    │   └── github-repo.service.test.ts
    └── github-repo.service.ts  # Parser使用例

注意: features/<feature>/types.ts は削除済み
→ z.infer<typeof schema> による型推論を使用
```

### ESLint設定例

```json
{
  "rules": {
    "filenames/match-regex": [
      "error",
      "^[a-z]+(-[a-z]+)*\\.(service|repository|controller|middleware|entity|dto|interface|types|schema|parser|error)\\.(ts|js)$"
    ]
  }
}
```

## 結果・影響

### ポジティブな影響

- **開発効率の向上**: ファイルの役割が即座に理解でき、検索・navigationが高速化
- **品質の向上**: 一貫した命名により、コードレビュー時の理解が促進
- **オンボーディング効率化**: 新メンバーがプロジェクト構造を迅速に把握
- **保守性の向上**: 大規模化してもファイル管理が容易

### 注意点

- **移行コスト**: 既存ファイルがある場合のリネーム作業
- **学習コスト**: チームメンバーへの命名規則の周知
- **ツール設定**: ESLint等での命名規則強制の設定が必要

### 監視すべきメトリクス

- ファイル検索時間の短縮
- コードレビュー時の理解速度向上
- 新メンバーのオンボーディング期間短縮
- ファイル命名に関する質問・修正の減少

## ルート実装のベストプラクティス

### 機能単位でのルート構成

**推奨構成**: ルート定義とエンドポイント実装を機能ごとにまとめて配置

```typescript
// routes/profile/index.ts
export const createProfileRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService
) => {
  // ===== プロフィール取得機能 =====

  // プロフィール取得ルート定義
  const getProfileRoute = createRoute({
    // ルート定義...
  });

  // プロフィール取得エンドポイント
  app.openapi(getProfileRoute, async (c) => {
    // エンドポイント実装...
  });

  // ===== プロフィール更新機能 =====

  // プロフィール更新ルート定義
  const updateProfileRoute = createRoute({
    // ルート定義...
  });

  // プロフィール更新エンドポイント
  app.openapi(updateProfileRoute, async (c) => {
    // エンドポイント実装...
  });
};
```

**利点**:

- 関連するコードが物理的に近い位置に配置
- 一つの機能の修正時に必要なコードが同じ場所にある
- 新機能追加時のパターンが明確
- 機能単位でのコードレビューが容易

**避けるべきパターン**:

```typescript
// ❌ ルート定義とエンドポイント実装が分離
const getProfileRoute = createRoute({...})
const updateProfileRoute = createRoute({...})

// 離れた場所でエンドポイント実装
app.openapi(getProfileRoute, ...)
app.openapi(updateProfileRoute, ...)
```

### スキーマ定義のコロケーション

**推奨構成**: スキーマ定義も機能ごとにまとめて配置

```typescript
// routes/profile/index.ts
export const createProfileRoutes = (...) => {
  // ===== 共通スキーマ定義 =====
  
  // 複数機能で共通利用するスキーマ
  const userProfileResponseSchema = z.object({...})

  // ===== プロフィール更新機能 =====
  
  // プロフィール更新専用スキーマ定義
  const updateProfileRequestSchema = z.object({...})
  
  // プロフィール更新ルート定義
  const updateProfileRoute = createRoute({
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateProfileRequestSchema, // 直上で定義
          },
        },
      },
    },
    // ...
  })
  
  // プロフィール更新エンドポイント
  app.openapi(updateProfileRoute, async (c) => {...})
}
```

**スキーマ配置の原則**:

1. **機能固有スキーマ**: 該当機能ブロック内に定義
2. **機能間共通スキーマ**: ファイル内の共通セクションに定義
3. **フィーチャー間共通スキーマ**: `presentation/schemas/[schema-name].schema.ts` に定義

```
presentation/
├── routes/
│   ├── profile/
│   │   └── index.ts          # スキーマ + ルート + エンドポイント
│   └── settings/
│       └── index.ts          # スキーマ + ルート + エンドポイント
├── schemas/                   # フィーチャー間共通スキーマ
│   ├── user-base.schema.ts    # ユーザー基本情報
│   ├── user-error.schema.ts   # エラーレスポンス
│   └── user-params.schema.ts  # パラメータ
└── shared/
    └── error-handling.ts
```

**利点**:
- スキーマ・ルート・エンドポイントの完全なコロケーション
- 一機能の修正で複数ファイルを編集する必要がなくなる
- スキーマの使用箇所が明確で保守性向上
- Import文の削減

## 関連資料

- [Angular Style Guide - Naming](https://angular.io/guide/styleguide#naming)
- [NestJS Documentation - File structure](https://docs.nestjs.com/)
- [packages/backend/CLAUDE.md - フォルダ構成ガイド](../packages/backend/CLAUDE.md)
