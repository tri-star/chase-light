# フォルダ構成ガイドライン

## 概要

このドキュメントは、`packages/backend`におけるフォルダ構成の標準的なアプローチを定義します。一貫性のある構成を維持することで、コードの可読性、保守性、および拡張性を向上させることを目的とします。

## 基本構成

プロジェクトのソースコードは、主に`src`ディレクトリ内に配置されます。`src`ディレクトリは、機能単位で分割されたモジュール（フィーチャー）と、複数のフィーチャーで共有されるコンポーネントから構成されます。

```
src
├── db/
│   ├── connection.ts
│   ├── schema.ts
│   └── migrations/
├── features/
│   ├── auth/
│   └── user/
└── shared/
    └── utils/
```

### `src/db`

データベース関連のファイルを格納します。

- `connection.ts`: データベース接続を管理します。
- `schema.ts`: Drizzle ORMのスキーマ定義を記述します。
- `migrations/`: データベースマイグレーションファイルを格納します。

### `src/features`

アプリケーションの主要な機能（フィーチャー）ごとにディレクトリを作成します。各フィーチャーディレクトリは、クリーンアーキテクチャに基づいたレイヤー構造を持ちます。

```
features/[feature-name]/
├── domain/
├── repositories/
├── services/
└── presentation/
```

- **`domain`**: ビジネスロジックとエンティティ（型定義）を配置します。フレームワークや外部ライブラリへの依存を最小限に抑えるべきです。
- **`repositories`**: データ永続化層。データベースや外部APIとのやり取りを抽象化します。
- **`services`**: アプリケーション固有のユースケースを実装します。`domain`と`repositories`を組み合わせてビジネスロジックを実行します。
- **`presentation`**: APIのエンドポイント定義、リクエスト/レスポンスのスキーマ、ルーティング、およびエラーハンドリングを担当します。

### `src/shared`

複数のフィーチャーで共有される汎用的なコードを配置します。

- `utils/`: 共通のユーティリティ関数など。

## `presentation`レイヤーの詳細

`presentation`レイヤーは、APIの公開インターフェースを定義する重要な役割を担います。

```
presentation/
├── routes/
│   └── [resource-name]/
│       ├── __tests__/
│       └── index.ts
├── schemas/
│   ├── [resource-name]-base.schema.ts
│   └── [resource-name]-error.schema.ts
├── shared/
│   └── error-handling.ts
├── index.ts
└── routes.ts
```

- **`routes`**: Honoのルート定義をリソース単位で分割して記述します。
- **`schemas`**: Zodを使用したリクエスト/レスポンスのスキーマ定義を配置します。
- **`shared`**: `presentation`レイヤー内で共有されるコンポーネント（エラーハンドリングなど）を配置します。
- **`index.ts`**: フィーチャーのAPIルーターを外部に公開するエントリーポイントです。
- **`routes.ts`**: フィーチャー内のすべてのルートを統合します。
