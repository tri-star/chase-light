# Backend プロジェクト構成ガイド

このドキュメントは、TypeScript + Hono + Drizzle で構成されたAPIサーバーのフォルダ構成とコーディング規則を定義します。

## プロジェクト概要

- **フレームワーク**: Hono (軽量Web framework)
- **言語**: TypeScript
- **ORM**: Drizzle ORM
- **データベース**: PostgreSQL
- **デプロイ**: ECS・Lambda両対応
- **認証**: Auth0統合

## フォルダ構成

### 推奨構成（Features-First Approach）

コロケーションを意識し、機能単位でコードを整理します。

```
packages/backend/src/
├── app.ts                    # 共通Honoアプリケーション定義
├── lambda.ts                 # Lambda用エントリポイント
├── server.ts                 # ECS用HTTPサーバーエントリポイント
├── index.ts                  # デフォルトエクスポート（Lambda）
├── features/                 # 機能単位の実装
│   ├── auth/                # 認証機能
│   │   ├── services/        # 機能別サービス
│   │   │   ├── auth-token.service.ts      # トークン管理
│   │   │   ├── auth-validation.service.ts # 認証検証
│   │   │   ├── auth-session.service.ts    # セッション管理
│   │   │   └── __tests__/   # サービス層テスト
│   │   │       ├── auth-token.service.test.ts
│   │   │       ├── auth-validation.service.test.ts
│   │   │       └── auth-session.service.test.ts
│   │   ├── repositories/
│   │   │   └── auth.repository.ts
│   │   ├── presentation/
│   │   │   ├── routes.ts    # Honoルート定義
│   │   │   └── schemas.ts   # Zodスキーマ
│   │   └── types.ts         # TypeScript型定義
│   ├── users/               # ユーザー管理
│   │   ├── services/        # 機能別サービス
│   │   │   ├── user-profile.service.ts    # プロフィール管理
│   │   │   ├── user-preference.service.ts # 設定管理
│   │   │   └── user-notification.service.ts # 通知管理
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── user-preference.repository.ts
│   │   ├── presentation/
│   │   │   ├── routes.ts
│   │   │   └── schemas.ts
│   │   └── types.ts
│   ├── dataSource/          # データソース管理（GitHubリポジトリ等）
│   │   ├── services/
│   │   │   ├── github-repo.service.ts     # GitHubリポジトリ管理
│   │   │   ├── repo-events.service.ts     # イベント管理
│   │   │   └── repo-sync.service.ts       # 同期処理
│   │   ├── repositories/
│   │   │   ├── data-source.repository.ts
│   │   │   └── repository.repository.ts
│   │   ├── presentation/
│   │   │   ├── routes.ts
│   │   │   └── schemas.ts
│   │   └── types.ts
│   └── common/              # 機能横断的なコード
│       ├── logging/
│       └── monitoring/
├── shared/                  # 共通ユーティリティ
│   ├── middleware/          # カスタムミドルウェア
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── error.ts
│   │   └── __tests__/       # ミドルウェアテスト
│   │       ├── auth.test.ts
│   │       ├── validation.test.ts
│   │       └── error.test.ts
│   ├── utils/               # ヘルパー関数
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   └── __tests__/       # ユーティリティテスト
│   │       ├── encryption.test.ts
│   │       └── validation.test.ts
│   └── types/               # 共通型定義
│       └── api.ts
└── db/                      # データベース関連
    ├── connection.ts        # DB接続設定
    ├── schema.ts            # Drizzleスキーマ定義
    └── migrations/          # マイグレーションファイル
```

### フォルダ構成の設計思想

#### **機能別サービス分割の採用理由**

従来の単一`services.ts`ファイルは、機能が複雑になると以下の問題が発生します：

- **ファイルサイズの肥大化**（500行以上になりがち）
- **責任の混在**（認証・プロフィール・通知が一つのクラスに）
- **テストの複雑化**（単一ファイルで多数の機能をテスト）
- **並行開発の困難**（複数人で同じファイルを編集）

#### **採用した解決策**

1. **機能別サービス分割**: 責任を明確に分離
2. **presentation層の導入**: ルートとスキーマを分離
3. **repositories複数化**: 関連エンティティごとに分割
4. **テスト構造の改善**: フォルダ単位でのテスト整理

#### **各層の責務**

- **services/**: 特定の機能に特化したビジネスロジック
- **repositories/**: データアクセス層（1テーブル1リポジトリ原則）
- **presentation/**: HTTP層（ルート・バリデーション）
- **types.ts**: その機能固有の型定義
- **tests**: 各層のコロケーションテスト（ADR003準拠）

## コーディング規則

### 1. Honoルート定義

#### ✅ 推奨：直接ハンドラー定義

```typescript
// features/users/presentation/routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchemas } from "./schemas";
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

#### ❌ 避けるべき：Rails風コントローラークラス

```typescript
// 避ける
class UsersController {
  async list(c: Context) {
    // 型推論が困難
    return c.json("list users");
  }
}
```

### 2. 分割されたサービス層の実装

```typescript
// features/users/services/user-profile.service.ts
import { UserRepository } from "../repositories/user.repository";
import type { CreateUserRequest, UpdateUserRequest } from "../types";
import type { User } from "../types";

export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findMany();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    // プロフィール作成に特化したビジネスロジック
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("このメールアドレスは既に使用されています");
    }

    return this.userRepository.create(data);
  }

  async updateUserProfile(
    id: string,
    data: UpdateUserRequest
  ): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    // プロフィール更新の業務ルール
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error("このメールアドレスは既に使用されています");
      }
    }

    return this.userRepository.update(id, data);
  }
}

// features/users/services/user-preference.service.ts
import { UserPreferenceRepository } from "../repositories/user-preference.repository";
import type { UserPreference, UpdatePreferenceRequest } from "../types";

export class UserPreferenceService {
  constructor(private userPreferenceRepository: UserPreferenceRepository) {}

  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    return this.userPreferenceRepository.findByUserId(userId);
  }

  async updatePreferences(
    userId: string,
    data: UpdatePreferenceRequest
  ): Promise<UserPreference> {
    const existing = await this.userPreferenceRepository.findByUserId(userId);

    if (existing) {
      return this.userPreferenceRepository.update(existing.id, data);
    }

    return this.userPreferenceRepository.create({ userId, ...data });
  }
}

// features/users/services/user-notification.service.ts
import { NotificationRepository } from "../repositories/notification.repository";
import type { NotificationRequest } from "../types";

export class UserNotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async sendUserNotification(
    userId: string,
    notification: NotificationRequest
  ): Promise<void> {
    // 通知送信の業務ルール
    await this.notificationRepository.create({
      userId,
      ...notification,
      sentAt: new Date(),
    });

    // 外部通知サービスとの連携
    // await externalNotificationService.send(userId, notification)
  }

  async getUserNotifications(
    userId: string,
    isRead?: boolean
  ): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId, { isRead });
  }
}

// services/index.ts - サービス統合・依存性注入
import { UserRepository } from "../repositories/user.repository";
import { UserPreferenceRepository } from "../repositories/user-preference.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { UserProfileService } from "./user-profile.service";
import { UserPreferenceService } from "./user-preference.service";
import { UserNotificationService } from "./user-notification.service";

// 依存性注入によるサービス初期化
export const userProfileService = new UserProfileService(new UserRepository());
export const userPreferenceService = new UserPreferenceService(
  new UserPreferenceRepository()
);
export const userNotificationService = new UserNotificationService(
  new NotificationRepository()
);
```

### 3. スキーマ定義（Zod）

```typescript
// features/users/presentation/schemas.ts
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

### 3. サービス層の実装

```typescript
// features/users/services.ts
import { UserRepository } from "./repository";
import type { CreateUserRequest, UpdateUserRequest } from "./schemas";
import type { User } from "./types";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findMany();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    // ビジネスロジック
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("このメールアドレスは既に使用されています");
    }

    return this.userRepository.create(data);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    return this.userRepository.update(id, data);
  }
}

// シングルトンインスタンス
export const userService = new UserService(new UserRepository());
```

### 4. リポジトリ層の実装

```typescript
// features/users/repository.ts
import { DrizzleBaseRepository, eq, and, db } from "../../db/base";
import { users } from "../../db/schema";
import type { User, CreateUserData } from "./types";

export class UserRepository extends DrizzleBaseRepository<User> {
  constructor() {
    super(users);
  }

  async create(data: CreateUserData): Promise<User> {
    const newUser = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [user] = await db.insert(users).values(newUser).returning();

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  async findMany(
    filters?: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<User[]> {
    // Context7のDrizzle ORM推奨パターン: .$dynamic()を使用
    let query = db.select().from(users).$dynamic();

    // フィルタリング
    const whereConditions = [];
    if (filters?.email) {
      whereConditions.push(eq(users.email, filters.email as string));
    }
    if (filters?.githubUsername) {
      whereConditions.push(
        eq(users.githubUsername, filters.githubUsername as string)
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // ページネーション
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return user || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}
```

### 5. 型定義

```typescript
// features/users/types.ts
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "../../db/schema";

export type User = InferSelectModel<typeof users>;
export type CreateUserData = Omit<
  InferInsertModel<typeof users>,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateUserData = Partial<CreateUserData>;

// API レスポンス型
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  createdAt: string;
  updatedAt: string;
}

// ページネーション
export interface UsersListResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## デプロイ対応

### マルチエントリポイント設計

ECSとLambda両方で動作するよう、以下の構成を採用します：

```typescript
// src/app.ts - 共通アプリケーション
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./features/auth/routes";
import userRoutes from "./features/users/routes";
import dataSourceRoutes from "./features/dataSource/routes";

export const createApp = () => {
  const app = new Hono()
    .use("*", logger())
    .use(
      "*",
      cors({
        origin: process.env.FRONTEND_URL?.split(",") || [
          "http://localhost:3000",
        ],
        credentials: true,
      })
    )
    .route("/api/auth", authRoutes)
    .route("/api/users", userRoutes)
    .route("/api/data-sources", dataSourceRoutes)
    .get("/health", (c) =>
      c.json({ status: "ok", timestamp: new Date().toISOString() })
    );

  return app;
};

// src/lambda.ts - Lambda用エントリポイント
import { handle } from "hono/aws-lambda";
import { createApp } from "./app";

const app = createApp();
export const handler = handle(app);

// src/server.ts - ECS用HTTPサーバー
import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT) || 3000;

console.log(`Server running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});

// src/index.ts - デフォルトエクスポート（Lambda）
export { handler } from "./lambda";
```

## テスト戦略

[ADR003-testing.md](../../docs/adr/ADR003-testing.md) に基づき、以下の方針でテストを実装します：

### ユニットテスト

**基本方針**

- **コロケーション**を重視し、テスト対象の同階層に `__tests__/` フォルダを作成
  - 例: `features/auth/services/` → `features/auth/services/__tests__/`
  - 各テストファイルは `[対象ファイル名].test.ts` の命名規則を採用
- vitestを使用し、describe/testの名前は**日本語**で記述
- `test()` を `it()` より優先
- Parameterized testを積極活用

**コロケーション原則の利点**

- テスト対象のコードと物理的に近い場所にテストを配置
- ファイル移動時のテストファイル同期が容易
- 各層（services/, repositories/, presentation/）ごとの独立性を保持
- IDEでの関連ファイルの発見・navigation効率が向上

```typescript
// features/users/services/__tests__/user-profile.service.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";
import { UserProfileService } from "../user-profile.service";
import { UserRepository } from "../../repositories/user.repository";

const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
} as unknown as UserRepository;

describe("UserProfileService", () => {
  let userProfileService: UserProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    userProfileService = new UserProfileService(mockUserRepository);
  });

  describe("createUser", () => {
    test.each([
      {
        input: { name: "田中太郎", email: "tanaka@example.com" },
        expected: {
          id: "uuid-1",
          name: "田中太郎",
          email: "tanaka@example.com",
        },
      },
      {
        input: {
          name: "John Doe",
          email: "john@example.com",
          githubUsername: "johndoe",
        },
        expected: {
          id: "uuid-2",
          name: "John Doe",
          email: "john@example.com",
          githubUsername: "johndoe",
        },
      },
    ])(
      "正常なユーザーデータでユーザーを作成: %o",
      async ({ input, expected }) => {
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
        vi.mocked(mockUserRepository.create).mockResolvedValue(expected as any);

        const result = await userProfileService.createUser(input);

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
          input.email
        );
        expect(mockUserRepository.create).toHaveBeenCalledWith(input);
        expect(result).toEqual(expected);
      }
    );

    test("重複するメールアドレスの場合はエラーをスローする", async () => {
      const existingUser = { id: "existing-id", email: "existing@example.com" };
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        existingUser as any
      );

      await expect(
        userProfileService.createUser({
          name: "新規ユーザー",
          email: "existing@example.com",
        })
      ).rejects.toThrow("このメールアドレスは既に使用されています");
    });
  });

  describe("境界値テスト", () => {
    test.each([
      [null, "findByIdにnullを渡した場合"],
      [undefined, "findByIdにundefinedを渡した場合"],
      ["", "findByIdに空文字を渡した場合"],
      ["invalid-uuid", "findByIdに不正なUUIDを渡した場合"],
    ])("getUserById: %s - %s", async (input, description) => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await userProfileService.getUserById(input as string);

      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(input);
    });
  });
});
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
// features/users/routes.ts
import { authMiddleware } from "../../shared/middleware/auth";

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
import { userSchemas } from "./schemas";

const users = new Hono().post(
  "/",
  validateSchema("json", userSchemas.create),
  async (c) => {
    const data = c.req.valid("json"); // 型安全
    // ...
  }
);
```

## データベース設計

[ADR004-database-schema.md](../../docs/adr/ADR004-database-schema.md) に基づき、以下の原則を遵守します：

### Data Sourceパターン

- 将来のNPM対応を見据えたDataSourceパターンを採用
- `data_sources` ↔ `repositories` は1対1の関係
- UUIDv7をアプリケーション側で生成

### リポジトリ実装原則

```typescript
// 共通ベースクラス活用
export abstract class DrizzleBaseRepository<T> implements BaseRepository<T> {
  constructor(protected table: PgTable) {}

  protected generateId(): string {
    // UUIDv7生成（時系列順序保証）
    return randomUUID(); // 本番ではUUIDv7ライブラリを使用
  }

  // Context7推奨：動的クエリビルダーの使用
  protected buildDynamicQuery() {
    return db.select().from(this.table).$dynamic();
  }
}
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

## 開発・デバッグ

### ローカル開発

```bash
# 開発サーバー起動（ECSモード）
pnpm dev:backend

# Lambda環境でのテスト
pnpm --filter backend test:lambda

# ビルド
pnpm --filter backend build
```

### ログ戦略

```typescript
// shared/utils/logger.ts
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        meta,
        timestamp: new Date().toISOString(),
      })
    );
  },
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        stack: error?.stack,
        meta,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
```

## 設計の利点と注意点

### ✅ 新構造の利点

1. **責任の明確化**

   - 各サービスが単一の責任を持つ（Single Responsibility Principle）
   - プロフィール管理と通知機能の混在を避ける

2. **並行開発の促進**

   - 複数人が異なるファイルで作業可能
   - マージコンフリクトの軽減

3. **テストの改善**

   - 機能単位でのテスト分離
   - モックの簡略化

4. **保守性の向上**
   - 特定機能の変更時の影響範囲を限定
   - コードの理解しやすさ

### ⚠️ 注意すべき点

1. **過度な分割の回避**

   - 100行未満の小さな機能は統合を検討
   - 機能的結合度を保つ

2. **依存関係の管理**

   - サービス間の循環依存を避ける
   - 依存性注入パターンの一貫性

3. **テスト戦略の調整**
   - 統合テストでのサービス間連携確認
   - モックと実装のバランス

### 段階的移行戦略

既存のコードがある場合の移行手順：

1. **Phase 1**: presentation層の分離（routes.ts → presentation/routes.ts）
2. **Phase 2**: サービスの機能別分割
3. **Phase 3**: リポジトリの分割
4. **Phase 4**: テスト構造の改善

## 継続的改善

### コードレビューチェックリスト

- [ ] フォルダ構成が機能単位で適切に分離されているか
- [ ] サービスが単一の責任を持っているか（100-300行程度）
- [ ] presentation層とservices層が適切に分離されているか
- [ ] 依存性注入が適切に実装されているか
- [ ] Zodスキーマで適切にバリデーションが定義されているか
- [ ] エラーハンドリングが適切に実装されているか
- [ ] テストが各層の**tests**フォルダに適切にコロケーションされているか
- [ ] テストファイル名が`[対象ファイル名].test.ts`の命名規則に従っているか
- [ ] describe/testの名前が日本語で記述されているか
- [ ] 型安全性が確保されているか（any型の濫用がないか）
- [ ] ビジネスロジックがサービス層に適切に分離されているか
- [ ] サービス間の循環依存がないか

### パフォーマンス考慮事項

- データベースクエリの最適化（N+1問題の回避）
- インデックス活用（schema.tsでの適切なindex定義）
- ページネーション実装
- キャッシュ戦略（必要に応じてRedis等の検討）

## トラブルシューティング

- Lintエラーの解決方法
  - @packages/backend/docs/lint-error-troubleshooting.md 参照

## 参考資料

- [Hono公式ドキュメント](https://hono.dev/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Zod公式ドキュメント](https://zod.dev/)
- [ADR003: テスト戦略](../../docs/adr/ADR003-testing.md)
- [ADR004: データベーススキーマ設計](../../docs/adr/ADR004-database-schema.md)
