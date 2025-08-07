# フロントエンド API実装ガイドライン

## 基本方針

フロントエンドにおけるAPI実装は、以下の基本方針に従って実装します：

- **全てのAPIは `/api` エンドポイント配下のAPIを呼び出す方針とすること**
- **APIルート(`packages/frontend/server/api`)配下にBFF（Backend For Frontend）としてのAPIを定義し、この中からBackend API(`packages/backend`)のAPIを呼び出す**
- **CSR時は`useFetch`や`useAsyncData`を利用しDedupを行う**
- **Backend APIから取得したデータは境界を跨いでいるため、zodなどによりスキーマ検証を行う**
- **APIルートはBackendAPIとの橋渡しや整形といった側面が強く、NGは型チェックにより検知し易いと考え、テストは記述しない（代わりに各ページのテストを記述する）**

## アーキテクチャパターン

### BFF（Backend For Frontend）パターン

```
[Frontend Pages/Components] 
         ↓ $fetch / useFetch
[Frontend API Routes (/api)]  ← BFF層
         ↓ fetch
[Backend API]
         ↓
[Database]
```

### フロントエンドAPIの責務

1. **認証の統合**: セッション管理とAuth0認証の統合
2. **データ変換**: Backend APIのレスポンスをフロントエンド向けに整形
3. **エラーハンドリング**: 統一されたエラーレスポンス形式の提供
4. **スキーマ検証**: 境界を跨ぐデータのランタイム検証
5. **キャッシュ制御**: 必要に応じたキャッシュヘッダーの設定

## APIルート実装パターン

### ディレクトリ構造

```
server/api/
├── auth/           # 認証関連API
│   ├── session.get.ts
│   ├── logout.post.ts
│   └── callback.get.ts
├── github/         # GitHub連携API  
│   ├── repos.get.ts
│   └── user.get.ts
└── protected/      # 認証必須API
    └── test.get.ts
```

### 基本的なAPIルート実装例

#### 1. 認証不要のAPI

```typescript
// server/api/github/user.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { username } = query;

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username is required',
    });
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'chase-light2-app',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `GitHub API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('GitHub user API proxy error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch GitHub user data',
    });
  }
});
```

#### 2. 認証必須のAPI

```typescript
// server/api/protected/data-sources.get.ts
export default defineEventHandler(async (event) => {
  // セッション認証を要求
  const session = await requireUserSession(event);

  if (!session.accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No access token available',
    });
  }

  try {
    // Backend APIを呼び出し
    const response = await fetch('http://backend-api:3001/api/data-sources', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Backend API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // スキーマ検証（zodを使用）
    const dataSourceSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.enum(['github']),
      createdAt: z.string().datetime(),
    });

    const validatedData = z.array(dataSourceSchema).parse(data);

    return {
      success: true,
      data: validatedData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Data sources API proxy error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch data sources',
    });
  }
});
```

#### 3. POSTリクエストの実装例

```typescript
// server/api/data-sources.post.ts
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  
  if (!session.accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    });
  }

  const body = await readBody(event);

  // リクエストボディのスキーマ検証
  const createDataSourceSchema = z.object({
    name: z.string().min(1),
    repositoryUrl: z.string().url(),
    watchEvents: z.array(z.enum(['releases', 'issues', 'pull_requests'])),
  });

  try {
    const validatedBody = createDataSourceSchema.parse(body);

    const response = await fetch('http://backend-api:3001/api/data-sources', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.message || 'Failed to create data source',
      });
    }

    const data = await response.json();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors,
      });
    }
    throw error;
  }
});
```

## クライアントサイド実装パターン

### データ取得のベストプラクティス

#### 1. ページ初期表示時のデータ取得

```typescript
// pages/dashboard.vue
<script setup>
// SSRとCSR両対応、自動キャッシュ
const { data: dataSources, pending, error, refresh } = await useFetch('/api/data-sources');

// エラーハンドリング
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.message || 'Failed to load data sources',
  });
}
</script>
```

#### 2. ユーザーアクション時のデータ取得

```typescript
// pages/data-sources/create.vue
<script setup>
const createDataSource = async (formData: CreateDataSourceRequest) => {
  try {
    const result = await $fetch('/api/data-sources', {
      method: 'POST',
      body: formData,
    });
    
    if (result.success) {
      await navigateTo('/dashboard');
    }
  } catch (error: any) {
    console.error('Create data source error:', error);
    
    // ユーザーフレンドリーなエラーメッセージ
    const errorMessage = error.data?.statusMessage || 'データソースの作成に失敗しました';
    // エラー表示ロジック
  }
};
</script>
```

#### 3. リアルタイムデータの取得

```typescript
// composables/useDataSources.ts
export const useDataSources = () => {
  const { data, pending, error, refresh } = useFetch('/api/data-sources', {
    key: 'data-sources',
    // 自動リフレッシュ設定
    server: true,
    default: () => [],
  });

  // 手動リフレッシュ
  const refetchDataSources = () => refresh();

  // 新規作成後のキャッシュ無効化
  const invalidateCache = () => {
    refreshCookie('data-sources');
    refresh();
  };

  return {
    dataSources: data,
    pending,
    error,
    refetch: refetchDataSources,
    invalidate: invalidateCache,
  };
};
```

### useFetch vs $fetch vs useAsyncData の使い分け

| 関数 | 用途 | SSR | キャッシュ | リアクティブ |
|------|------|-----|------------|-------------|
| `useFetch` | ページ初期表示時のデータ取得 | ✅ | ✅ | ✅ |
| `$fetch` | ユーザーアクション時のAPI呼び出し | ❌ | ❌ | ❌ |
| `useAsyncData` | カスタムデータ取得ロジック | ✅ | ✅ | ✅ |

#### 推奨パターン

```typescript
// ✅ 推奨: ページ初期表示
const { data } = await useFetch('/api/data-sources');

// ✅ 推奨: ユーザーアクション（フォーム送信など）
const result = await $fetch('/api/data-sources', { method: 'POST', body: formData });

// ✅ 推奨: 複雑なデータ変換が必要な場合
const { data } = await useAsyncData('processed-data', async () => {
  const rawData = await $fetch('/api/raw-data');
  return processData(rawData);
});
```

## スキーマ検証戦略

### zodスキーマの配置

```
server/api/
├── schemas/
│   ├── data-source.ts      # データソース関連スキーマ
│   ├── user.ts             # ユーザー関連スキーマ
│   └── common.ts           # 共通スキーマ
└── data-sources/
    └── index.get.ts        # スキーマをインポートして使用
```

### スキーマ定義例

```typescript
// server/api/schemas/data-source.ts
import { z } from 'zod';

export const DataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['github']),
  repositoryUrl: z.string().url(),
  watchEvents: z.array(z.enum(['releases', 'issues', 'pull_requests'])),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateDataSourceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  repositoryUrl: z.string().url(),
  watchEvents: z.array(z.enum(['releases', 'issues', 'pull_requests'])).min(1),
});

export const DataSourceListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DataSourceSchema),
  timestamp: z.string().datetime(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;
export type CreateDataSourceRequest = z.infer<typeof CreateDataSourceRequestSchema>;
export type DataSourceListResponse = z.infer<typeof DataSourceListResponseSchema>;
```

## エラーハンドリング

### 統一されたエラーレスポンス形式

```typescript
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```

### エラーハンドリングユーティリティ

```typescript
// server/api/utils/error-handler.ts
export const handleAPIError = (error: unknown, context: string) => {
  console.error(`${context} error:`, error);

  if (error instanceof z.ZodError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request data',
      data: {
        validationErrors: error.errors,
      },
    });
  }

  if (error instanceof Error && error.message.includes('fetch')) {
    throw createError({
      statusCode: 503,
      statusMessage: 'External service unavailable',
    });
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error',
  });
};
```

## 認証統合

### セッション管理パターン

```typescript
// server/api/auth/session.get.ts
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);

    if (!session) {
      return {
        data: null,
      };
    }

    // セキュリティ上、トークンは除外してクライアントに返す
    const { _accessToken, _refreshToken, ...safeSession } = session;

    return {
      data: {
        user: {
          id: safeSession.userId,
          email: safeSession.email,
          name: safeSession.name,
          avatar: safeSession.avatar,
          provider: safeSession.provider,
        },
        loggedInAt: safeSession.loggedInAt?.toISOString() || new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('Session fetch error:', err);
    return {
      data: null,
    };
  }
});
```

### 認証必須APIのパターン

```typescript
// server/utils/auth.ts
export const requireUserSession = async (event: any) => {
  const session = await getUserSession(event);
  
  if (!session || !session.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    });
  }

  return session;
};
```

## パフォーマンス最適化

### キャッシュ戦略

```typescript
// server/api/data-sources.get.ts
export default defineEventHandler(async (event) => {
  // キャッシュヘッダーの設定
  setResponseHeaders(event, {
    'Cache-Control': 'private, max-age=300', // 5分間キャッシュ
  });

  // 実装...
});
```

### Deduplication（重複排除）

```typescript
// pages/dashboard.vue
<script setup>
// 同じキーでの重複リクエストを自動的に排除
const { data: dataSources } = await useFetch('/api/data-sources', {
  key: 'data-sources',
});

// 別のコンポーネントでも同じキーを使用すれば、
// 既存のリクエストを再利用
</script>
```

## テスト戦略

### APIルートのテスト方針

このプロジェクトでは、APIルートは以下の理由により**テストを記述しない**方針とします：

1. **橋渡し・整形が主目的**: Backend APIとフロントエンドの間のデータ変換が主な役割
2. **型チェックによる検知**: TypeScriptの型チェックにより、多くのエラーを開発時に検知可能
3. **ページレベルでのテスト**: 代わりに各ページのテストを記述し、APIとの統合を検証

### 代替テスト戦略

```typescript
// tests/pages/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('ダッシュボードページでデータソース一覧が表示される', async ({ page }) => {
  // ログイン処理
  await page.goto('/auth/test-login');
  await page.getByTestId('login-button').click();

  // ダッシュボードに移動
  await page.goto('/dashboard');

  // データソース一覧の表示確認
  await expect(page.getByTestId('data-sources-list')).toBeVisible();
  
  // APIレスポンスの検証
  const response = await page.waitForResponse('/api/data-sources');
  expect(response.status()).toBe(200);
});
```

## ベストプラクティス

### 1. 型安全性の確保

```typescript
// 型定義とランタイム検証を組み合わせ
const DataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

type DataSource = z.infer<typeof DataSourceSchema>;

// APIルートでの使用
const validatedData: DataSource[] = DataSourceSchema.array().parse(response.data);
```

### 2. エラーメッセージの国際化対応

```typescript
const errorMessages = {
  VALIDATION_ERROR: 'リクエストデータが不正です',
  UNAUTHORIZED: '認証が必要です',
  FORBIDDEN: 'このリソースにアクセスする権限がありません',
  NOT_FOUND: '指定されたリソースが見つかりません',
  INTERNAL_ERROR: '内部エラーが発生しました',
} as const;
```

### 3. ログ出力の統一

```typescript
// server/utils/logger.ts
export const apiLogger = {
  info: (message: string, meta?: unknown) => {
    console.log(`[API] ${message}`, meta);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[API ERROR] ${message}`, error);
  },
};
```

## トラブルシューティング

### よくある問題と解決策

#### 1. セッション認証エラー

```
Error: Authentication required
```

**原因**: セッションが無効または期限切れ

**解決策**:
```typescript
// セッション状態の確認
const session = await getUserSession(event);
if (!session) {
  // 再ログインを促す
  throw createError({
    statusCode: 401,
    statusMessage: 'Session expired. Please login again.',
  });
}
```

#### 2. Backend APIとの通信エラー

```
Error: Backend API error: 500 Internal Server Error
```

**原因**: Backend APIサーバーが停止またはエラー

**解決策**:
```typescript
try {
  const response = await fetch(backendUrl, options);
  if (!response.ok) {
    // リトライロジックの実装
    await retryWithBackoff(() => fetch(backendUrl, options));
  }
} catch (error) {
  // フォールバック処理
  return generateFallbackResponse();
}
```

#### 3. Zodスキーマ検証エラー

```
ZodError: Invalid input
```

**原因**: Backend APIからのレスポンスが期待する形式と異なる

**解決策**:
```typescript
try {
  return schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Schema validation failed:', error.errors);
    // スキーマを緩和するか、Backend APIを修正
    return schema.partial().parse(data);
  }
  throw error;
}
```

## 関連ドキュメント

- [Backend API実装ガイドライン](../../../backend/docs/guidelines/api-implementation-guide.md)
- [テスト戦略](../testing-strategy.md)
- [認証に関するADR](../../../docs/adr/ADR001-auth.md)
- [Nuxt.js公式ドキュメント - Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [Zod公式ドキュメント](https://zod.dev/)