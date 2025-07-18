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

| レイヤ              | パターン                         | 例                             |
| ------------------- | -------------------------------- | ------------------------------ |
| Service             | `[機能名].service.ts`            | `user-profile.service.ts`      |
| Repository          | `[エンティティ名].repository.ts` | `user.repository.ts`           |
| Controller          | `[機能名].controller.ts`         | `auth.controller.ts`           |
| Middleware          | `[機能名].middleware.ts`         | `auth.middleware.ts`           |
| Domain Entity       | `[エンティティ名].ts`            | `user.ts` (型定義のみ)         |
| DTO                 | `[用途].dto.ts`                  | `create-user.dto.ts`           |
| Interface           | `[名前].interface.ts`            | `user-repository.interface.ts` |
| Type                | `[用途].types.ts`                | `api.types.ts`                 |
| Controller Schema   | `[データ名].schema.ts`           | `user-request.schema.ts`       |
| Error               | `[用途].error.ts`                | `github-parse.error.ts`        |
| Utils               | `[機能名].ts`                    | `auth-config.ts`               |
| Route               | `index.ts`                       | `routes/profile/index.ts`      |
| Presentation Schema | `[用途]-[詳細].schema.ts`        | `user-error.schema.ts`         |

### 機能名の命名規則

- **単一語**: `auth`, `user`, `order`
- **複数語**: `data-source`, `user-preference`, `order-history`
- **頭字語**: 小文字で統一 `api`, `dto`, `jwt`

### テストファイルの命名規則

- 各テストファイルは `[対象ファイル名].test.ts` の命名規則を採用
- テストファイルは対象ファイルと同じ階層の `__tests__/` フォルダに配置

```
features/user/
├── domain/
│   ├── __tests__/
│   │   └── user.test.ts
│   └── user.ts
├── services/
│   ├── __tests__/
│   │   ├── user-profile.service.test.ts
│   │   ├── user-preference.service.test.ts
│   │   └── user-notification.service.test.ts
│   ├── user-profile.service.ts
│   ├── user-preference.service.ts
│   └── user-notification.service.ts
└── presentation/
    ├── schemas/
    │   ├── __tests__/
    │   │   └── user-request.schema.test.ts
    │   └── user-request.schema.ts
    └── routes/
        └── profile/
            ├── __tests__/
            │   └── index.test.ts
            └── index.ts
```

### レイヤ別ファイル配置

新しいアーキテクチャでは、スキーマとドメイン型の配置が以下のように変更されています：

#### ドメインレベル（`src/features/[feature]/domain/`）

- **命名**: `[エンティティ名].ts`（例：`user.ts`）
- **内容**: TypeScriptのtypeでドメイン型の定義、エンティティ関連ロジック
- **注意**: Zodスキーマは定義しない

#### Controller層（`src/features/[feature]/presentation/schemas/`）

- **命名**: `[用途].schema.ts`（例：`user-base.schema.ts`、`user-error.schema.ts`）
- **内容**: HTTP入出力用のZodスキーマ（Controller層共通スキーマ）

#### 機能別ルート（`src/features/[feature]/presentation/routes/[機能]/`）

- **命名**: `index.ts`
- **内容**: ルート定義、機能固有Zodスキーマ、エンドポイント実装

### ESLint設定例

```json
{
  "rules": {
    "filenames/match-regex": [
      "error",
      "^[a-z]+(-[a-z]+)*\\.(service|repository|controller|middleware|dto|interface|types|schema|parser|error)\\.(ts|js)$|^[a-z]+(-[a-z]+)*\\.(ts|js)$"
    ]
  }
}
```

注記：ドメインレベルのファイル（`user.ts`など）は拡張子前にレイヤ名を含まないため、正規表現を調整しています。

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

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [アーキテクチャパターン](./architecture-patterns.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
- [テスト戦略](./testing-strategy.md)
- [Angular Style Guide - Naming](https://angular.io/guide/styleguide#naming)
- [NestJS Documentation - File structure](https://docs.nestjs.com/)
