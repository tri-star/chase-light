# Backend テスト戦略

本ドキュメントは、backendパッケージにおけるunit/componentテストの方針を定めたものです。

## 概要

本プロジェクトでは、以下の3つのテスト分類を採用します：

- **Unit Test**: APIの内部で呼ばれるパーツ（service層、ドメインロジック、ユーティリティ関数）のテスト
- **Component Test**: DBアクセスまで通して実施するテスト（単位: API 1エンドポイント）
- **E2E Test**: 複数機能に跨るテスト（別途検討）

## 用語選択の背景

### Integration Test → Component Test への変更

当初「Integration Test」と命名していたものを「Component Test」に変更しました。これは以下の理由によります：

1. **最近のテスティングトレンドへの準拠**

   - フロントエンド分野ではComponent Testingが標準化（Cypress、Playwright等）
   - マイクロサービス文脈で「サービス単体 + 実DB」をComponent Testと呼ぶ例が増加

2. **理論的背景**

   - Martin Fowlerの「Component Test = システムの一部だけをテスト」定義に準拠
   - Kent C. DoddのTesting Trophyで推奨される「UnitとE2Eの間の実用的な粒度」に対応

3. **実装構成との整合性**
   ```
   ┌────────────────────┐        ┌─────────┐
   │      API Service   │<─────│  実DB   │
   └────────────────────┘        └─────────┘
   ↑ HTTP エンドポイント経由でテスト
   ```
   - 外部サービスはスタブ
   - DBはモックせず実際のアクセス
   - 「サービス全体をまとめて切り出したテスト」= Component Test

## テスト分類詳細

### Unit Test

**対象レイヤー**: presentationよりも下のレイヤー

- service層:
  - **IMPORTANT: Service層のテストはComponentテストと重複が多いので、基本的にはComponentテストでカバーすることを推奨**
  - Componentテストでのテストが難しいパターン網羅を確認するようなテストはService層でのUnitテストを実施
- ドメインロジック
- ユーティリティ関数

**特徴**:

- DBへのアクセスはモック/スタブを通して行う
- 外部サービスへのアクセスもモック/スタブ
- 高速実行を重視
- 細かな振る舞いの検証

**DBアクセスの扱い**:

- DBアクセスのモック/スタブはテストコード内で実装
- テスト実行速度への影響を考慮し、実DBアクセスは行わない

### Component Test

**対象レイヤー**: presentationレイヤー

**特徴**:

- APIエンドポイント単位でのテスト
- DBへのアクセスは実際のDBを通して行う
- 外部サービスへのアクセスはスタブ実装を通して行う
- エンドポイントの動作を包括的に検証

**実装方針**:

- 実際のRepositoryクラスを通してDBアクセス
- ハッピーパスに限らず、様々なパターンをテスト
- パターン数が非常に多い場合は、下位レイヤーでのテストも併用

**外部サービスの扱い**:

- スタブ実装はプロダクションコードの一部として含める
- テストコードではなく、本番環境以外で利用可能な形で実装
- 例：ローカル環境でもスタブに差し替えて動作させる

### E2E Test

**対象**: 複数機能に跨るテスト

**現状**: 別途検討予定

## 利用技術

### テストフレームワーク

**vitest**を採用

**選択理由**:

- TypeScriptサポートが充実
- 高速な実行速度
- モダンなAPIと優れた開発体験

### テストデータファクトリ

**drizzle-seed**を採用

**選択理由**:

- Drizzle team公式ライブラリ
- スキーマ定義との完全連動
- TypeScript完全サポート
- Faker機能内蔵によるリアルなテストデータ生成

**基本的な使用例**:

```typescript
import { seed, reset } from "drizzle-seed";

// 基本的なデータ生成
await seed(db, schema, { count: 1000 });

// カスタマイズしたデータ生成
await seed(db, schema).refine((f) => ({
  users: {
    count: 20,
    columns: {
      name: f.fullName(),
      email: f.email({ isUnique: true }),
    },
    with: {
      posts: 10, // 各ユーザーに10件の投稿を生成
    },
  },
}));

// データベースリセット
await reset(db, schema);
```

**主要機能**:

- リアルなテストデータ生成（名前、メールアドレス、住所等）
- 関連データの自動生成（`with`オプション）
- 一意性制約への対応（`isUnique`オプション）
- 決定的データ生成（`seed`オプションで再現可能）

## 実装方針

### テスト構成とコロケーション原則

**基本方針**: **コロケーション**を重視し、テスト対象の同階層に `__tests__/` フォルダを作成

```
src/
  features/
    user/
      services/
        __tests__/
          user-profile.service.test.ts   # Unit Test。Componentテストと重複することが多いのと、モックでの検証にしかならないので、Componentテストでの試験を推奨
          user-preference.service.test.ts
          user-notification.service.test.ts
        user-profile.service.ts
        user-preference.service.ts
        user-notification.service.ts
      repositories/
        __tests__/
          user.repository.test.ts
          user-preference.repository.test.ts
        user.repository.ts
        user-preference.repository.ts
      presentation/
        __tests__/
          user.component.test.ts         # Component Test
        routes/
          profile/
            index.ts
          settings/
            index.ts
        routes.ts
      parsers/
        __tests__/
          user-api.parser.test.ts
        user-api.parser.ts
```

### テストファイル命名規則

- 各テストファイルは `[対象ファイル名].test.ts` の命名規則を採用
- describe/testの名前は**日本語**で記述
- `test()` を `it()` より優先
- Parameterized testを積極活用

### コロケーション原則の利点

- **テスト対象のコードと物理的に近い場所にテストを配置**
- **ファイル移動時のテストファイル同期が容易**
- **各層（services/, repositories/, presentation/）ごとの独立性を保持**
- **IDEでの関連ファイルの発見・navigation効率が向上**

### Component Test実装例

```typescript
// user.component.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { seed, reset } from "drizzle-seed";
import request from "supertest";
import { app } from "../../../app";
import { db } from "../../../db/connection";
import * as schema from "../../../db/schema";

describe("POST /api/users", () => {
  beforeEach(async () => {
    // テストデータのセットアップ
    await seed(db, schema).refine((f) => ({
      users: {
        count: 5,
        columns: {
          email: f.email({ isUnique: true }),
          name: f.fullName(),
        },
      },
    }));
  });

  afterEach(async () => {
    // データベースリセット
    await reset(db, schema);
  });

  it("should create user and return 201", async () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
    };

    const response = await request(app).post("/api/users").send(userData);

    expect(response).toMatchObject({
      status: 201,
      body: {
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
      },
    });
  });

  it("should return 400 for invalid email", async () => {
    const userData = {
      name: "Test User",
      email: "invalid-email",
    };

    const response = await request(app).post("/api/users").send(userData);

    expect(response).toMatchObject({
      status: 400,
      body: {
        error: expect.stringContaining("email"),
      },
    });
  });
});
```

### Unit Test実装例

```typescript
// user.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { UserService } from "../user.service";
import type { UserRepository } from "../../../repositories/user.repository";

describe("UserService", () => {
  it("should validate email format", () => {
    // Repositoryをモック
    const mockUserRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
    } as unknown as UserRepository;

    const userService = new UserService(mockUserRepository);

    const isValid = userService.validateEmail("test@example.com");
    expect(isValid).toBe(true);

    const isInvalid = userService.validateEmail("invalid-email");
    expect(isInvalid).toBe(false);
  });
});
```

## 実行方針

### 開発フロー

1. **新機能開発時**:

   - まずUnit Testを書いて個別機能を確認
   - 次にComponent Testでエンドポイント全体を確認

2. **バグ修正時**:

   - 該当レイヤーのテストを追加・修正
   - 影響範囲に応じてComponent Testも確認

3. **リファクタリング時**:
   - Unit Testで内部実装の変更を確認
   - Component Testで外部仕様の維持を確認

### テスト実行

```bash
# 全テスト実行
pnpm test

# Unit Testのみ
pnpm test src/**/*.test.ts

# Component Testのみ
pnpm test src/**/component.test.ts

# 特定機能のテスト
pnpm test src/features/user
```

## 今後の検討課題

### テストデータファクトリの詳細設計

- drizzle-seedを使った複雑な関連データ生成
- パフォーマンスとデータサイズのバランス
- テスト間でのデータ分離戦略

### E2Eテストとの住み分け

- 複数サービス間の連携テスト
- 外部サービスとの実際の通信テスト
- ユーザージャーニー全体のテスト

### CI/CD環境での最適化

- テスト実行時間の最適化
- 並列実行戦略
- テストデータベースの管理

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [アーキテクチャパターン](./architecture-patterns.md)
- [ファイル命名規則](./file-naming-conventions.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
