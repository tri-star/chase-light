# APIルート実装ガイドライン

## ステータス

決定済み

## コンテキスト

HonoフレームワークとOpenAPIを使用したAPIエンドポイントの実装において、保守性とスケーラビリティを確保するための実装パターンを確立する必要がある。特に、ルート定義、スキーマ設計、エンドポイント実装の一貫性とコロケーション原則を重視した設計が求められる。

### 主要な課題

- ルート定義とエンドポイント実装の分離による保守性の低下
- スキーマ定義の分散による一貫性の欠如
- 機能追加時のファイル管理の複雑化
- 型安全性の確保とランタイム検証の両立

## 決定

### 採用する実装パターン

**機能単位でのコロケーション + スキーマ定義の適切な配置**

ルート定義、エンドポイント実装、スキーマ定義を機能単位でコロケーション（物理的に近い場所に配置）し、関連するコードの保守性を向上させる。

## ルート実装のベストプラクティス

### 推奨実装パターン

**機能単位でのルート構成**: ルート定義とエンドポイント実装を機能ごとにまとめて配置

```typescript
// features/user/presentation/routes/profile/index.ts
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { userBaseSchema } from "../../schemas/user-base.schema";
import { UserProfileService } from "../../../services/user-profile.service";

export const createProfileRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService
) => {
  // ===== 共通スキーマ定義 =====

  // 複数機能で共通利用するスキーマ
  const userProfileResponseSchema = z
    .object({
      user: userBaseSchema, // schemas/から取得した共通スキーマを利用
    })
    .openapi("UserProfileResponse");

  // ===== プロフィール取得機能 =====

  // プロフィール取得ルート定義
  const getProfileRoute = createRoute({
    method: "get",
    path: "/profile",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userProfileResponseSchema,
          },
        },
        description: "プロフィール情報を取得",
      },
      401: {
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
        description: "認証エラー",
      },
    },
    security: [{ Bearer: [] }],
    tags: ["Profile"],
  });

  // プロフィール取得エンドポイント
  app.openapi(getProfileRoute, async (c) => {
    const user = c.get("user"); // 認証ミドルウェアから取得

    try {
      const profile = await userProfileService.getUserProfile(user.id);
      if (!profile) {
        return c.json({ error: "プロフィールが見つかりません" }, 404);
      }
      return c.json({ user: profile }, 200);
    } catch (error) {
      return c.json({ error: "プロフィール取得に失敗しました" }, 500);
    }
  });

  // ===== プロフィール更新機能 =====

  // 機能固有スキーマ定義（この機能でのみ使用）
  const updateProfileRequestSchema = z
    .object({
      name: z.string().min(1).optional(),
      githubUsername: z.string().min(1).max(39).optional(),
      timezone: z.string().optional(),
    })
    .openapi("UpdateProfileRequest");

  // プロフィール更新ルート定義
  const updateProfileRoute = createRoute({
    method: "put",
    path: "/profile",
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateProfileRequestSchema, // 直上で定義
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userProfileResponseSchema, // ファイル内共通スキーマ
          },
        },
        description: "プロフィール更新成功",
      },
      400: {
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              details: z.array(z.string()).optional(),
            }),
          },
        },
        description: "バリデーションエラー",
      },
    },
    security: [{ Bearer: [] }],
    tags: ["Profile"],
  });

  // プロフィール更新エンドポイント
  app.openapi(updateProfileRoute, async (c) => {
    const user = c.get("user");
    const data = c.req.valid("json");

    try {
      const updatedProfile = await userProfileService.updateUserProfile(
        user.id,
        data
      );

      if (!updatedProfile) {
        return c.json({ error: "プロフィールが見つかりません" }, 404);
      }

      return c.json({ user: updatedProfile }, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json(
          {
            error: "バリデーションエラー",
            details: error.messages,
          },
          400
        );
      }
      return c.json({ error: "プロフィール更新に失敗しました" }, 500);
    }
  });
};
```

### 実装パターンの利点

- **関連するコードが物理的に近い位置に配置**
- **一つの機能の修正時に必要なコードが同じ場所にある**
- **新機能追加時のパターンが明確**
- **機能単位でのコードレビューが容易**

### 避けるべきパターン

```typescript
// ❌ ルート定義とエンドポイント実装が分離
const getProfileRoute = createRoute({...})
const updateProfileRoute = createRoute({...})

// 離れた場所でエンドポイント実装
app.openapi(getProfileRoute, ...)
app.openapi(updateProfileRoute, ...)
```

## スキーマ設計とコロケーション

### スキーマ配置の原則

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

### スキーマ配置の詳細ルール

1. **機能固有スキーマ**: 該当機能ブロック内に定義（`updateProfileRequestSchema`等）
2. **機能間共通スキーマ**: ファイル内の共通セクションに定義（`userProfileResponseSchema`等）
3. **フィーチャー間共通スキーマ**: `presentation/schemas/[schema-name].schema.ts` に定義（`userBaseSchema`等）

### 新しいフォルダ構造

```
presentation/
├── routes/
│   ├── profile/
│   │   └── index.ts          # 機能固有スキーマ + ルート + エンドポイント
│   └── settings/
│       └── index.ts          # 機能固有スキーマ + ルート + エンドポイント
├── schemas/                   # フィーチャー間共通スキーマ
│   ├── user-base.schema.ts    # ユーザー基本情報（共通）
│   ├── user-error.schema.ts   # エラーレスポンス（共通）
│   └── user-params.schema.ts  # パラメータ（共通）
├── shared/
│   └── error-handling.ts     # エラーハンドリングユーティリティ
└── index.ts                  # エクスポート統合（schemas/からの再エクスポート含む）
```

### 旧パターンからの移行

- ❌ `routes/[feature]/schemas.ts` ファイルは廃止
- ❌ `shared/common-schemas.ts` ファイルは廃止
- ✅ 機能固有スキーマは`routes/[feature]/index.ts`内に直接定義
- ✅ 共通スキーマは`schemas/[name].schema.ts`に分離

## Honoルート定義パターン

### 推奨：直接ハンドラー定義

```typescript
// features/users/presentation/routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchemas } from "../schemas/user.schema";
import { userProfileService } from "../services/user-profile.service";
import { userPreferenceService } from "../services/user-preference.service";

const users = new Hono()
  .get("/", async (c) => {
    const users = await userProfileService.getAllUsers();
    return c.json(users);
  })
  .post("/", zValidator("json", userSchemas.create), async (c) => {
    const data = c.req.valid("json");
    const user = await userProfileService.createUser(data);
    return c.json(user, 201);
  })
  .get("/:id", zValidator("param", userSchemas.params), async (c) => {
    const { id } = c.req.valid("param");
    const user = await userProfileService.getUserById(id);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(user);
  })
  .get(
    "/:id/preferences",
    zValidator("param", userSchemas.params),
    async (c) => {
      const { id } = c.req.valid("param");
      const preferences = await userPreferenceService.getUserPreferences(id);
      return c.json(preferences);
    }
  );

export default users;
```

### 避けるべき：Rails風コントローラークラス

```typescript
// ❌ 避ける
class UsersController {
  async list(c: Context) {
    // 型推論が困難
    return c.json("list users");
  }
}
```

## スキーマ定義（Zod）

### 基本的なスキーマ設計

```typescript
// features/users/schemas/user.schema.ts
import { z } from "zod";

export const userSchemas = {
  create: z.object({
    name: z.string().min(1, "名前は必須です"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    githubUsername: z.string().optional(),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    githubUsername: z.string().optional(),
  }),

  params: z.object({
    id: z.string().uuid("有効なUUIDを指定してください"),
  }),

  query: z.object({
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("20"),
  }),
};

export type CreateUserRequest = z.infer<typeof userSchemas.create>;
export type UpdateUserRequest = z.infer<typeof userSchemas.update>;
export type UserParams = z.infer<typeof userSchemas.params>;
```

### OpenAPIとの統合

```typescript
import { z } from "zod";

// OpenAPI用のスキーマ定義
const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    githubUsername: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("UserResponse"); // OpenAPI用の名前を指定

const createUserRequestSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    githubUsername: z.string().optional(),
  })
  .openapi("CreateUserRequest");
```

## エラーハンドリング

### 統一されたエラーレスポンス

```typescript
// presentation/schemas/error.schema.ts
import { z } from "zod";

export const errorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string().optional(),
    details: z.array(z.string()).optional(),
    timestamp: z.string().datetime().optional(),
  })
  .openapi("ErrorResponse");

export const validationErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    ),
  })
  .openapi("ValidationErrorResponse");
```

### エラーハンドリングの実装

```typescript
// presentation/shared/error-handling.ts
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export class APIError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: string[]
  ) {
    super(message);
    this.name = "APIError";
  }
}

export const handleAPIError = (c: Context, error: unknown) => {
  if (error instanceof APIError) {
    return c.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      error.statusCode
    );
  }

  if (error instanceof HTTPException) {
    return c.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      error.status
    );
  }

  // 予期しないエラー
  console.error("Unexpected error:", error);
  return c.json(
    {
      error: "内部サーバーエラーが発生しました",
      timestamp: new Date().toISOString(),
    },
    500
  );
};
```

## ミドルウェア活用

### 認証ミドルウェア

```typescript
// shared/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// 使用例
const users = new Hono()
  .use("*", authMiddleware) // 全エンドポイントに認証適用
  .get("/", (c) => {
    const user = c.get("user"); // 型安全
    return c.json({ currentUser: user });
  });
```

### バリデーションミドルウェア

```typescript
// shared/middleware/validation.ts
import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

export const validateSchema = (
  target: "json" | "query" | "param",
  schema: ZodSchema
) => zValidator(target, schema);

// 使用例
import { validateSchema } from "../../shared/middleware/validation";
import { userSchemas } from "../schemas/user.schema";

const users = new Hono().post(
  "/",
  validateSchema("json", userSchemas.create),
  async (c) => {
    const data = c.req.valid("json"); // 型安全
    // ...
  }
);
```

## 型安全性の確保

### RPC（Remote Procedure Call）モード

```typescript
// クライアント側での型安全なAPI呼び出し
import { hc } from "hono/client";
import type { AppType } from "../backend/src/app";

const client = hc<AppType>("/api");

// 型安全なAPI呼び出し
const response = await client.users.$get();
const users = await response.json(); // 型推論される

const createResponse = await client.users.$post({
  json: { name: "田中太郎", email: "tanaka@example.com" }, // 型チェック
});
```

## パフォーマンス考慮事項

### スキーマの最適化

```typescript
// 頻繁に使用されるスキーマのキャッシュ
const userBaseSchemaCompiled = userBaseSchema.parse;

// バッチ処理用の最適化
export const validateUsersBatch = (users: unknown[]) => {
  return users.map((user) => userBaseSchemaCompiled(user));
};
```

### ページネーション実装

```typescript
const getUsersRoute = createRoute({
  method: "get",
  path: "/users",
  request: {
    query: z.object({
      page: z.string().transform(Number).default("1"),
      limit: z.string().transform(Number).max(100).default("20"),
      sort: z.enum(["name", "created_at"]).optional(),
      order: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            users: z.array(userResponseSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});
```

## コードレビューチェックリスト

- [ ] ルート定義とエンドポイント実装が同じ場所にコロケーションされているか
- [ ] スキーマ定義が適切な場所に配置されているか（機能固有 vs 共通）
- [ ] OpenAPIスキーマに適切な名前が付けられているか
- [ ] エラーハンドリングが統一されているか
- [ ] 認証・認可が適切に実装されているか
- [ ] バリデーションが適切に実装されているか
- [ ] 型安全性が確保されているか（any型の濫用がないか）
- [ ] レスポンスのステータスコードが適切か
- [ ] ページネーションが必要な場合に実装されているか

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [アーキテクチャパターン](./architecture-patterns.md)
- [ファイル命名規則](./file-naming-conventions.md)
- [テスト戦略](./testing-strategy.md)
- [Hono公式ドキュメント](https://hono.dev/)
- [Zod公式ドキュメント](https://zod.dev/)
