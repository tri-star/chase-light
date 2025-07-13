# Backend テスト戦略

このドキュメントは、`backend`パッケージにおけるテストの基本方針と実践的なガイドラインを定めます。

## 1. テストの基本方針

### Component Testを最優先

本プロジェクトでは、**Component Test**をテスト戦略の中心に据えます。

- **目的:** 実際のデータベース(DB)と接続し、APIエンドポイントが期待通りに動作することを保証します。これにより、より実践的な品質担保を目指します。
- **Unit Testの位置づけ:** Service層など、ビジネスロジック単体のテストはComponent Testと重複することが多いため、補助的な役割とします。Component Testで網羅しきれない複雑なロジックや、特定のコーナーケースを検証する場合にのみUnit Testを作成してください。

### コロケーション原則

テストコードは、**テスト対象ファイルの隣**に配置します。

- **場所:** テスト対象ファイルと同じ階層に `__tests__` フォルダを作成し、その中にテストファイルを格納します。
- **利点:**
    - テスト対象とテストコードの関連性が一目でわかります。
    - ファイルの移動やリファクタリングの際に、テストコードも追従しやすくなります。

## 2. テストの種類

### Component Test

- **対象:** Presentationレイヤー（APIエンドポイント）
- **範囲:** Honoのアプリケーションインスタンスを直接テストし、DBアクセスまで含めた一連の動作を検証します。
- **DBアクセス:** モックせず、実際のDB（テスト用DB）に接続します。
- **外部サービス:** スタブを利用して通信をシミュレートします。
- **実装例:**
    - `@packages/backend/src/features/data-sources/presentation/routes/data-sources/__tests__/index.test.ts`

### Unit Test

- **対象:** Service層、Repository層、ドメインロジック、ユーティリティ関数など
- **範囲:** 個別の関数やメソッドの振る舞いを検証します。
- **DBアクセス:** モック/スタブ化します。
- **実装例:**
    - `@packages/backend/src/features/data-sources/repositories/__tests__/data-source.repository.test.ts`

## 3. 使用ツール

- **テストフレームワーク:** `vitest`
- **テストデータ生成:** `drizzle-seed`
    - Drizzle公式のライブラリで、DBスキーマと連動したリアルなテストデータを効率的に生成できます。

## 4. 実装ガイドライン

- **ファイル名:** `[対象ファイル名].test.ts` という命名規則に従ってください。
- **テスト記述:** `describe` や `test` の説明は、テスト内容が明確に伝わるように**日本語**で記述します。

## 5. 開発フローとテスト実行

### 開発フロー

1.  **機能開発時:** まずComponent Testを作成し、APIの仕様を満たしていることを確認します。必要に応じてUnit Testでロジックを補強します。
2.  **バグ修正時:** まず再現テストを書き、修正後にそのテストが通ることを確認します。

### テスト実行コマンド

```bash
# backendパッケージの全テストを実行
pnpm --filter backend test

# 特定の機能（例: data-sources）のテストのみ実行
pnpm --filter backend test src/features/data-sources
```