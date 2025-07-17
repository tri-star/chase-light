# ファイル命名規則

## 概要

このドキュメントでは、`packages/backend`内で使用されるファイルとディレクトリの命名規則を定めます。一貫した命名規則は、プロジェクトのナビゲーションを容易にし、ファイルの内容を予測しやすくします。

## 一般的な規則

- **形式**: `kebab-case`（ケバブケース）を使用します。
- **言語**: 原則として英語を使用します。
- **単語**: 略語を避け、明確で説明的な単語を選択します。

## レイヤーごとの命名規則

### `domain`

- エンティティやビジネスオブジェクトを表すファイルは、単数形で命名します。
  - 例: `user.ts`, `order.ts`

### `repositories`

- リポジトリクラスを定義するファイルは、`[entity-name].repository.ts`の形式で命名します。
  - 例: `user.repository.ts`

### `services`

- サービスクラスを定義するファイルは、`[feature-name].service.ts`の形式で命名します。
  - 例: `user-profile.service.ts`, `user-settings.service.ts`

### `presentation`

- **ルート定義**:
  - リソースに関連するルートを定義するファイルは、`index.ts`とし、リソース名のディレクトリ内に配置します。
    - 例: `routes/profile/index.ts`
  - フィーチャー全体のルートを統合するファイルは `routes.ts` とします。
    - 例: `presentation/routes.ts`
- **スキーマ定義**:
  - Zodスキーマを定義するファイルは、`[resource-name]-[purpose].schema.ts`の形式で命名します。
    - 例: `user-base.schema.ts`, `user-error.schema.ts`
- **テストファイル**:
  - テストファイルは、`[file-name].test.ts` の形式で命名します。
    - 例: `user-profile.service.test.ts`

### `workers`

- **ワーカー関数**:
  - ワーカー関数のハンドラーファイルは、`handler.ts`とし、ワーカー名のディレクトリ内に配置します。
    - 例: `workers/list-datasources/handler.ts`
  - ワーカー関数のエントリーポイントは `index.ts` とします。
    - 例: `workers/list-datasources/index.ts`
- **StepFunctions定義**:
  - StepFunctionsのASL定義ファイルは、`[workflow-name].asl.json`の形式で命名します。
    - 例: `step-functions/repository-monitoring.asl.json`
  - SAMテンプレートファイルは、`sam-template.yaml`とします。
    - 例: `step-functions/sam-template.yaml`
- **テストファイル**:
  - ワーカー関数のテストファイルは、`handler.test.ts`の形式で命名します。
    - 例: `workers/list-datasources/__tests__/handler.test.ts`
  - 統合テストファイルは、`workflow.integration.test.ts`の形式で命名します。
    - 例: `workers/__tests__/workflow.integration.test.ts`

## ディレクトリ名

- 複数形を使用することが推奨されます（例: `features`, `services`, `repositories`）。
- テストコードはコロケーションを意識し、プロダクションコードと同じ階層に `__tests__` ディレクトリを作成します。
