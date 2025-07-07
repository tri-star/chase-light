# API実装ガイドライン

## 概要

このガイドラインは、`packages/backend`で新しいAPIを実装する際の標準的な手順とベストプラクティスを提供します。

## 実装フロー

新しいAPIエンドポイントを実装する際は、以下の順序で進めることが推奨されます。

1.  **Domain**: 型定義とビジネスロジックを定義します。
2.  **Repository**: データベースとのインタラクションを実装します。
3.  **Service**: ユースケースを実装します。
4.  **Presentation**: APIエンドポイントを公開します。

### 1. Domain層の実装

-   まず、扱うエンティティの型を `domain/[entity-name].ts` に定義します。
-   エンティティに関連する純粋なビジネスロジック（バリデーションなど）もここに記述します。

```typescript
// src/features/user/domain/user.ts
export type User = {
  id: string;
  name: string;
  email: string;
  // ...
};
```

### 2. Repository層の実装

-   `repositories/[entity-name].repository.ts` に、データベース操作を抽象化するクラスを作成します。
-   Drizzle ORMを使用し、CRUD操作（作成、読み取り、更新、削除）のメソッドを実装します。

```typescript
// src/features/user/repositories/user.repository.ts
import { db } from "../../../db/connection";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }
  // ...他のメソッド
}
```

### 3. Service層の実装

-   `services/[feature-name].service.ts` に、具体的なユースケースを実装するサービスクラスを作成します。
-   コンストラクタでリポジトリを注入（Dependency Injection）し、ビジネスロジックを組み立てます。

```typescript
// src/features/user/services/user-profile.service.ts
import { UserRepository } from "../repositories/user.repository";

export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

  async getUserProfile(userId: string) {
    return this.userRepository.findById(userId);
  }
}
```

### 4. Presentation層の実装

-   **スキーマ定義**: `presentation/schemas/` に、Zodを使用してリクエストとレスポンスのスキーマを定義します。
-   **ルート定義**: `presentation/routes/[resource-name]/index.ts` に、Honoと`@hono/zod-openapi`を使用してエンドポイントを定義します。
-   **認証**: `requireAuth`ミドルウェアを使用して、認証が必要なエンドポイントを保護します。
-   **エラーハンドリング**: `handleError`ユーティリティを使用して、エラーを適切に処理します。

```typescript
// presentation/routes/profile/index.ts
app.openapi(getProfileRoute, async (c) => {
  try {
    const authenticatedUser = requireAuth(c);
    const user = await userProfileService.getUserProfileByAuth0Id(authenticatedUser.sub);
    if (!user) {
      return userNotFoundResponse(c);
    }
    return c.json({ user }, 200);
  } catch (error) {
    return handleError(c, error, "プロフィール取得");
  }
});
```

## テスト

-   各レイヤーに対応するテストを作成します。
    -   **Service層**: `vitest`のモック機能を使用して、リポジトリをモック化し、ビジネスロジックをテストします。
    -   **Presentation層**: Honoの`request`メソッドを使用して、APIエンドポイントの統合テストを実施します。
-   テストは `__tests__` ディレクトリに配置します。
