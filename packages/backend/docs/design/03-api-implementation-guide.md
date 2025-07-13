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
import { userBaseSchema } from "../schemas/user-base.schema";
import { UserProfileService } from "../../../services/user-profile.service";

export const createProfileRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService
) => {
  // ===== 共通スキーマ定義 =====

  // 複数機能で共通利用するスキーマ
  const userProfileResponseSchema = z
    .object({
      user: userBaseSchema, // presentation/schemas/から取得した共通スキーマを利用
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

    // Service層の型に変換
    const serviceInput: UserCreateInputDto = {
      name: data.name,
      email: data.email,
      githubUsername: data.githubUsername,
      timezone: data.timezone,
    };

    try {
      const updatedProfile = await userProfileService.updateUserProfile(
        user.id,
        serviceInput
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

## Zodスキーマ設計とレイヤ別責任

### Zodを利用する方針

Controller層の入力/出力や、外部APIからのレスポンスなど、境界をまたいだ部分でのランタイムのバリデーションも含めたパース処理にZodを利用し、
アプリケーション内部ではドメイン層で定義したTypeScriptのtypeや、サービス層のDTO型を利用します。

**重要**: ドメイン層ではZodスキーマを定義せず、TypeScriptのtypeのみを定義します。

### レイヤ別スキーマ責任の原則

現在のアーキテクチャでは、Zodスキーマの定義と責任を各レイヤで明確に分離しています。

#### ドメインレベル（`src/features/[feature]/domain/**/*.ts`）

- **責任**: ビジネスドメインの型定義とエンティティ関連ロジック
- **定義内容**: エンティティの型をTypeScriptのtypeとして定義してexport
- **スキーマ**: 特にZodスキーマを定義しない。型の定義はTypeScriptのtypeを利用
- **例**: `User`型の定義

```typescript
// src/features/user/domain/user.ts

export type User = {
  id: string;
  auth0UserId: string;
  email: string;
  name: string;
  avatarUrl: string;
  githubUsername: string | null;
  timezone: string;
  // NOTE: 日付型カラムの場合、"日付無し"はnullで表現する
  createdAt: Date | null;
  updatedAt: Date | null;
};

// NOTE: domainフォルダ内のtsファイルには型定義の他、Entityに関するロジックを含んだ関数も定義する
```

#### DBレイヤ（`src/features/[feature]/repositories/**/*.ts`）

- **責任**: データの永続化とドメイン型への変換
- **スキーマ定義**: 特にZodスキーマは定義しない（Drizzleのスキーマが担当）
- **実装**: Repositoryレイヤでドメインの型（`User`型等）に変換して返す

```typescript
// src/features/user/repositories/user.repository.ts
import type { User } from "../domain/user";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // DrizzleでDBからデータを取得し、User型に変換して返す
    const dbUser = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!dbUser[0]) return null;

    return {
      id: dbUser[0].id,
      name: dbUser[0].name,
      email: dbUser[0].email,
      // ... User型に合わせて変換
    };
  }
}
```

#### Serviceレイヤ（`src/features/[feature]/services/**/*.ts`）

- **責任**: ビジネスロジックの実装
- **スキーマ定義**: 特にZodスキーマを定義しない（サービスレイヤのロジックが呼び出される時はその前でZodスキーマによるパースが行われている想定）
- **型定義**: パラメータ・戻り値の型はドメインの型か、`~InputDto`, `~OutputDto`の名前でビジネスロジック用のDTO型を使用
- **型の形式**: interfaceではなくtypeを利用

```typescript
// src/features/user/services/user-profile.service.ts
import { UserRepository } from "../repositories/user.repository";
import type { User } from "../domain/user";

export type UpdateProfileInputDto = {
  name: string;
  email: string;
};

export type UpdateProfileOutputDto = User;

export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

  async updateUserProfile(
    userId: string,
    input: UpdateProfileInputDto
  ): Promise<UpdateProfileOutputDto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    // メールアドレスの重複チェック（メール更新は別サービスで処理）
    // ここではname, githubUsername, timezoneのみ更新

    return this.userRepository.update(userId, input);
  }
}
```

#### Controllerレイヤ（`src/features/[feature]/presentation/routes/**/*.ts`）

- **責任**: HTTP入出力の処理とバリデーション
- **スキーマ定義**: Controllerレイヤで入力のZodスキーマを定義。これは、`@hono/zod-openapi`が担当
- **実装**: Service層を呼び出す前にServiceレイヤの型に変換する。Serviceの実行結果をHTTPレスポンスのスキーマに合うように変換する
- **シンプルなケース**: 「テーブル内のデータを単に取得してJSONで返すだけ」レベルの処理は特別にサービス層を設けない。こういったシンプルなケースでは、Repositoryレイヤを直接呼び出してそのままJSONで返す

```typescript
// src/features/user/presentation/routes/profile/index.ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import type { UpdateProfileInputDto } from "../../../services/user-profile.service";

// Controller層での入力スキーマ定義
const updateProfileRequestSchema = z
  .object({
    name: z.string().min(1, "名前は必須です"),
    email: z.string().email("有効なメールアドレスを入力してください"),
  })
  .openapi("UpdateProfileRequest");

// Controller実装
app.openapi(updateProfileRoute, async (c) => {
  const requestData = c.req.valid("json");

  // Service層の型に変換
  const serviceInput: UpdateProfileInputDto = {
    name: requestData.name,
    email: requestData.email,
  };

  const result = await userProfileService.updateUserProfile(
    currentUser.id,
    serviceInput
  );

  // HTTPレスポンスに変換
  return c.json(
    {
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        githubUsername: result.githubUsername,
        avatarUrl: result.avatarUrl,
        createdAt: result.createdAt?.toISOString() || "",
        updatedAt: result.updatedAt?.toISOString() || "",
      },
    },
    200
  );
});
```

### 特別なケース：シンプルなCRUD操作

「テーブル内のデータを単に取得してJSONで返すだけ」レベルの処理では、特別にService層を設けません。

```typescript
// シンプルなケースではRepository層を直接呼び出し
app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");

  const user = await userRepository.findById(id);
  if (!user) {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }

  return c.json({ user }, 200);
});
```

### 日付処理のガイドライン

#### Controller層での日付処理

- **入力**: `transform`を利用してISO8601+UTC文字列をDate型に変換してパースする
- **出力**: レスポンスを返す際は、Date型をISO8601+UTC文字列に変換して返す

```typescript
// 入力スキーマでの日付変換
const updateUserRequestSchema = z.object({
  name: z.string().optional(),
  targetDate: z.iso
    .datetime() // ISO8601形式のバリデーション
    .transform((str) => new Date(str)), // Date型に変換
});

// レスポンス時の日付変換
return c.json(
  {
    user: {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt?.toISOString() || "", // Date → ISO8601+UTC文字列
      updatedAt: user.updatedAt?.toISOString() || "",
    },
  },
  200
);
```

#### アプリケーション内部での日付処理

- **保持形式**: アプリケーション内部では日付はDate型として保持する
- **DB保存**: DBに保存する際はUTCの時刻として保存する

### フォルダ構造

```
src/features/user/
├── domain/
│   └── user.ts               # User 型定義（TypeScript type）
├── repositories/
│   └── user.repository.ts    # DB操作、ドメイン型への変換
├── services/
│   └── user-profile.service.ts # ビジネスロジック、DTO型定義
└── presentation/
    ├── routes/
    │   └── profile/
    │       └── index.ts      # HTTP入出力Zodスキーマ、Controller実装
    └── schemas/              # Controller層共通スキーマ（HTTP入出力用）
        └── user-base.schema.ts
```

### 旧パターンからの移行

- ❌ `src/features/[feature]/schemas` → ✅ `src/features/[feature]/domain`
- ✅ `presentation/schemas/` は継続使用（Controller層共通スキーマのため）
- ✅ ドメイン層：Zodスキーマを削除、TypeScriptのtypeのみ使用
- ✅ サービス層：Zodスキーマを削除、InputDto/OutputDto型のみ使用
- ✅ Controller層：Zodスキーマで入力バリデーション、レスポンス変換
- ✅ DTO命名規則の統一（`~InputDto`, `~OutputDto`）
- ✅ 型定義はinterfaceではなくtypeを利用

## Honoルート定義パターン

### 推奨：直接ハンドラー定義

```typescript
// features/users/presentation/routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchemas } from "./schemas/user.schema";
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

### Controller層でのスキーマ設計例

#### 1. 共通スキーマファイル

```typescript
// features/user/presentation/schemas/user-base.schema.ts
import { z } from "@hono/zod-openapi";

// ユーザー基本情報スキーマ（レスポンス用）
export const userBaseSchema = z.object({
  id: z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ユーザーID（UUID）",
  }),
  email: z.string().email().openapi({
    example: "user@example.com",
    description: "メールアドレス",
  }),
  name: z.string().openapi({
    example: "田中太郎",
    description: "ユーザー名",
  }),
});

// 型推論用エクスポート
export type UserBase = z.infer<typeof userBaseSchema>;
```

#### 2. ルート内でのインラインスキーマ定義

```typescript
// features/user/presentation/routes/profile/index.ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { userBaseSchema } from "../../schemas/user-base.schema";
import { USER_NAME, USER_EMAIL } from "../../../constants/user-validation.js";

export const createProfileRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService
) => {
  // 共通レスポンススキーマ
  const userProfileResponseSchema = z
    .object({
      user: userBaseSchema,
    })
    .openapi("UserProfileResponse");

  // ルート固有のリクエストスキーマ
  const updateProfileRequestSchema = z
    .object({
      name: z
        .string()
        .min(USER_NAME.MIN_LENGTH, USER_NAME.REQUIRED_ERROR_MESSAGE)
        .max(USER_NAME.MAX_LENGTH, USER_NAME.MAX_LENGTH_ERROR_MESSAGE)
        .openapi({
          example: "田中太郎",
          description: "ユーザー名",
        }),
      email: z
        .string()
        .min(USER_EMAIL.MIN_LENGTH, USER_EMAIL.REQUIRED_ERROR_MESSAGE)
        .max(USER_EMAIL.MAX_LENGTH, USER_EMAIL.MAX_LENGTH_ERROR_MESSAGE)
        .openapi({
          example: "tanaka@example.com",
          description: "メールアドレス",
        }),
    })
    .openapi("UpdateProfileRequest");

  // ルート定義
  const updateProfileRoute = createRoute({
    method: "put",
    path: "/profile",
    summary: "プロフィール更新",
    description: "認証済みユーザーのプロフィール情報を更新します",
    tags: ["Users"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateProfileRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userProfileResponseSchema,
          },
        },
        description: "更新されたプロフィール情報",
      },
      ...userErrorResponseSchemaDefinition,
    },
  });

  // エンドポイント実装
  app.openapi(updateProfileRoute, async (c) => {
    const input = c.req.valid("json");
    // 実装...
  });
};
```

#### 3. バリデーション定数の利用

```typescript
// features/user/constants/user-validation.ts
export const USER_NAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  REQUIRED_ERROR_MESSAGE: "名前は必須です",
  MAX_LENGTH_ERROR_MESSAGE: "名前は100文字以内で入力してください",
} as const;

export const USER_EMAIL = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 255,
  REQUIRED_ERROR_MESSAGE: "メールアドレスは必須です",
  MAX_LENGTH_ERROR_MESSAGE: "メールアドレスは255文字以内で入力してください",
} as const;
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
