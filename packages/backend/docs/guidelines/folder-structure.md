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
├── presentation/
└── workers/          # オプション: バックグラウンドタスク用
```

- **`domain`**: ビジネスロジックとエンティティ（型定義）を配置します。フレームワークや外部ライブラリへの依存を最小限に抑えるべきです。
- **`repositories`**: データ永続化層。データベースや外部APIとのやり取りを抽象化します。
- **`services`**: アプリケーション固有のユースケースを実装します。`domain`と`repositories`を組み合わせてビジネスロジックを実行します。
- **`presentation`**: APIのエンドポイント定義、リクエスト/レスポンスのスキーマ、ルーティング、およびエラーハンドリングを担当します。
- **`workers`**: バックグラウンドタスクやStepFunctions用のLambda関数を配置します。AWS Lambda、SQS、StepFunctionsなどのサーバーレスアーキテクチャで実行されるワーカー関数を含みます。

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

## `workers`レイヤーの詳細

`workers`レイヤーは、バックグラウンドタスクやStepFunctions用のLambda関数を配置するためのオプションレイヤーです。このレイヤーは、リアルタイムのAPIレスポンスが不要な非同期処理を実装する際に使用します。

```
workers/
├── [worker-name]/
│   ├── handler.ts
│   ├── __tests__/
│   │   └── handler.test.ts
│   └── index.ts
├── step-functions/
│   ├── [workflow-name].asl.json
│   └── sam-template.yaml
└── __tests__/
    └── workflow.integration.test.ts
```

- **`[worker-name]/`**: 個別のワーカー関数をディレクトリ単位で管理します。
- **`handler.ts`**: ワーカー関数のメインロジックを実装します。
- **`step-functions/`**: StepFunctionsの定義ファイルとSAMテンプレートを配置します。
- **`workflow.integration.test.ts`**: StepFunctionsフロー全体の統合テストを実装します。

### `workers`レイヤーの特徴

- **非同期処理**: リアルタイムレスポンスが不要な処理を実装します。
- **既存レイヤーとの連携**: `services`や`repositories`層を再利用して、ビジネスロジックを共有します。
- **AWS統合**: Lambda、SQS、StepFunctionsなどのAWSサービスと統合されます。
- **独立性**: `presentation`層とは独立して動作し、APIエンドポイントを持ちません。
