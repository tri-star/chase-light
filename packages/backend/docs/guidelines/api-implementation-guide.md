# APIルート実装ガイドライン

## 基本方針

API実装は、**機能単位でのコロケーション**（関連ファイルを近くに配置すること）を最優先します。これにより、コードの凝集性を高め、保守性を向上させます。

- **実装の全体像**: `@[packages/backend/src/features/data-sources]` フォルダの構成が標準的な実装例です。
- **レイヤードアーキテクチャ**: ドメイン、リポジトリ、サービス、プレゼンテーションの各層に責務を分離します。

## レイヤごとの責務

各レイヤの役割を明確に分離し、関心事を分離します。

- **Domain (`/domain`)**:
  - **責務**: ビジネスルールとエンティティの型定義。
  - **ルール**: TypeScriptの`type`のみを定義します。**Zodスキーマは定義しません。**
  - **実装例**: `@[packages/backend/src/features/data-sources/domain]`

- **Repository (`/repositories`)**:
  - **責務**: データベースとのやり取りと、DBのスキーマからドメイン型へのデータ変換。
  - **実装例**: `@[packages/backend/src/features/data-sources/repositories]`

- **Service (`/services`)**:
  - **責務**: ビジネスロジックの実装。
  - **ルール**:
    - 入出力にはDTO（Data Transfer Object）を使用し、`type ~InputDto`, `type ~OutputDto` の形式で命名します。
    - Zodスキーマは扱いません。
  - **実装例**: `@[packages/backend/src/features/data-sources/services]`

- **Presentation (`/presentation`)**:
  - **責務**: HTTPリクエストの受付、レスポンスの返却、および入力値のバリデーション。
  - **ルール**:
    - Honoの`createRoute`と`app.openapi`を使い、ルート定義と実装をセットで記述します。
    - リクエストのバリデーションにはZodスキーマを使用します。
  - **実装例**: `@[packages/backend/src/features/data-sources/presentation]`

## APIルート実装パターン

ルート定義は `presentation/routes` 内に配置します。

- **基本形**: `createRoute`でルート情報を定義し、直後に`app.openapi`でハンドラを実装します。これにより、ルート定義と実装が常に隣接し、見通しが良くなります。
- **シンプルなCRUD**: データを取得して返すだけのような単純な処理の場合、Service層を省略し、Repository層を直接呼び出すことができます。
- **実装例**: `@[packages/backend/src/features/data-sources/presentation/routes/index.ts]`

## スキーマ設計 (Zod)

スキーマはHTTPの境界（Controller層）でのみ使用し、ランタイムの型安全性を保証します。

- **配置場所**:
  - **機能固有スキーマ**: ルート定義ファイル内にインラインで記述します。
  - **複数ルート共通スキーマ**: `presentation/schemas` フォルダに配置します。
- **バリデーション定数**: `z.string().min(1)`のようなマジックナンバーは避け、`constants`フォルダに定数として切り出します。
- **実装例**:
  - **ルート内スキーマ**: `@[packages/backend/src/features/data-sources/presentation/routes/index.ts]`
  - **共通スキーマ**: `@[packages/backend/src/features/data-sources/presentation/schemas]`
  - **定数**: `@[packages/backend/src/features/data-sources/presentation/constants]`

## エラーハンドリング

- **カスタムエラー**: `APIError`クラス（`@[packages/backend/src/shared/errors/api-error.ts]`）を使い、ステータスコードとメッセージを明確に指定します。
- **エラーレスポンス**: 全てのエラーは、グローバルなエラーハンドラ（`@[packages/backend/src/shared/errors/error-handler.ts]`）によって統一された形式のJSONレスポンスに変換されます。
- **実装例**: `@[packages/backend/src/features/data-sources/errors]`

## その他ガイドライン

- **日付の扱い**:
  - **API境界**: 日付・時刻はISO 8601形式のUTC文字列で送受信します。
  - **アプリケーション内部**: `Date`オブジェクトとして扱います。
  - **スキーマ定義**: Zodの`transform`を使い、文字列と`Date`オブジェクトの相互変換を行います。