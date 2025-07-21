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

### データベース接続テストの前提条件

**重要:** データベースを扱うComponent TestやWorkerテストでは、必ずテストファイルの冒頭（通常は10行目付近）で `setupComponentTest()` を呼び出してください。

```typescript
import { setupComponentTest } from '../../../test-utils/component-test-setup'
import { describe, test, beforeEach, afterEach, expect } from 'vitest'
// その他のimport...

describe('テスト対象の説明', () => {
  setupComponentTest() // この行を必ず追加！
  
  // テストケース...
})
```

この関数は以下の処理を行います：

- テスト用データベースの初期化
- テスト実行前後のデータクリーンアップ
- 必要な環境変数の設定

`setupComponentTest()` を呼び出さないと、データベース接続エラーやテスト間でのデータ干渉が発生する可能性があります。

### モックとスタブの使い分け

**Component Test**では原則として実際のDBを使用しますが、以下の場合にはモックを活用します：

#### データベースエラーのテスト

データベース接続エラーなどの異常系をテストする場合は、リポジトリ層をモックして意図的にエラーを発生させます：

```typescript
test('データベースエラーが発生した場合、エラーを投げる', async () => {
  // Given: DataSourceRepositoryをモックしてエラーを発生させる
  const mockDataSourceRepository = {
    findMany: vi.fn().mockRejectedValue(new Error('Database connection failed'))
  };
  
  // サービス層でモックを使用
  const mockService = new RepositoryMonitorService(mockDataSourceRepository as any);
  
  // When & Then: エラーが投げられることを検証
  await expect(handler({}, mockContext)).rejects.toThrow('Database connection failed');
});
```

#### 外部API呼び出しのテスト

外部サービス（GitHub API、Auth0等）への呼び出しをテストする場合は、これらのサービスをモック化します：

```typescript
test('GitHub API呼び出しエラーを適切に処理する', async () => {
  // Given: GitHub APIクライアントをモック
  const mockGitHubApi = {
    getRepository: vi.fn().mockRejectedValue(new Error('GitHub API rate limit exceeded'))
  };
  
  // テスト実行...
});
```

この方法により、実際のデータベース接続を保ちながら、異常系やエラーケースを確実にテストできます。

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