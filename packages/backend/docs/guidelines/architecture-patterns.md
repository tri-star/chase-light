# アーキテクチャパターンガイドライン

## ステータス

決定済み

## コンテキスト

TypeScriptプロジェクトにおいて、型安全性とデータ変換の品質を向上させるためのアーキテクチャパターンを確立する必要がある。特に外部APIとの連携において、従来の`as`型キャストによる型安全性の問題を解決し、より堅牢なデータ処理パターンを採用する。

### 主要な課題

- `as`型キャストによるランタイム型安全性の欠如
- 外部APIデータの構造化されていないパース処理
- ビジネスルール検証の分散化
- エラーハンドリングの一貫性不足
- テスタビリティの低さ

## 決定

### 採用するアーキテクチャパターン

**Zod v4 + Parser Architecture**

従来の`as`型キャストを排除し、Zod v4スキーマ + Parser クラスによるアーキテクチャを採用する。これにより、ランタイム型検証、構造化されたエラーハンドリング、テスタビリティの向上を実現する。

## スキーマ設計パターン

### Core スキーマ + API固有スキーマ の分離

```typescript
// features/dataSource/schemas/repository.schema.ts

// Core スキーマ（内部ドメインオブジェクト用）
export const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  fullName: z.string().min(1), // camelCase
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  starCount: z.number().int().min(0),
  forkCount: z.number().int().min(0),
  language: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// GitHub API スキーマ（外部API固有）
export const githubRepositoryApiSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1), // snake_case
  description: z.string().nullable(),
  private: z.boolean(),
  stargazers_count: z.number().int().min(0),
  forks_count: z.number().int().min(0),
  language: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Repository = z.infer<typeof repositorySchema>;
export type GitHubRepositoryApi = z.infer<typeof githubRepositoryApiSchema>;
```

### スキーマ分離の利点

1. **データソース独立性**: GitHub API以外（DB、他API等）にも対応可能
2. **内部一貫性**: アプリケーション内部では統一されたデータ形式を使用
3. **フィールド名変換**: 外部APIのsnake_caseから内部のcamelCaseへの変換を明示
4. **バリデーション分離**: 外部データ検証と内部データ検証を独立して管理

## Parserクラス設計パターン

### 基本的なParserクラス構造

```typescript
// features/dataSource/parsers/github-api.parser.ts
import { GitHubApiParseError } from "../errors/github-parse.error";
import { 
  repositorySchema, 
  githubRepositoryApiSchema,
  type Repository 
} from "../schemas/repository.schema";

export class GitHubApiParser {
  /**
   * GitHub APIレスポンスからRepositoryオブジェクトをパース
   * @param apiData - GitHub APIからの生データ
   * @returns パース済みのRepositoryオブジェクト
   * @throws GitHubApiParseError パースに失敗した場合
   */
  static parseRepository(apiData: unknown): Repository {
    try {
      // 1. GitHub APIスキーマでパース（外部データの検証）
      const githubRepo = githubRepositoryApiSchema.parse(apiData);

      // 2. 内部オブジェクト形式に変換（フィールド名変換 + ビジネスルール適用）
      const repository: Repository = {
        id: githubRepo.id,
        name: githubRepo.name,
        fullName: githubRepo.full_name, // field name conversion
        description: githubRepo.description,
        isPrivate: githubRepo.private, // field name conversion
        starCount: githubRepo.stargazers_count, // field name conversion
        forkCount: githubRepo.forks_count, // field name conversion
        language: githubRepo.language,
        createdAt: githubRepo.created_at,
        updatedAt: githubRepo.updated_at,
      };

      // 3. 内部スキーマで最終検証（内部一貫性の確保）
      return repositorySchema.parse(repository);
    } catch (error) {
      throw new GitHubApiParseError("Repository parse failed", error, apiData);
    }
  }

  /**
   * 複数のリポジトリをパース
   * @param apiDataArray - GitHub APIからの配列データ
   * @returns パース済みのRepositoryオブジェクト配列
   */
  static parseRepositories(apiDataArray: unknown): Repository[] {
    if (!Array.isArray(apiDataArray)) {
      throw new GitHubApiParseError(
        "Expected array for repositories data", 
        null, 
        apiDataArray
      );
    }

    return apiDataArray.map((item, index) => {
      try {
        return this.parseRepository(item);
      } catch (error) {
        throw new GitHubApiParseError(
          `Repository parse failed at index ${index}`, 
          error, 
          item
        );
      }
    });
  }

  /**
   * ビジネスルール適用（例：プライベートリポジトリのフィルタリング）
   * @param repositories - リポジトリ配列
   * @param includePrivate - プライベートリポジトリを含めるか
   * @returns フィルタリング済みのリポジトリ配列
   */
  static filterRepositories(
    repositories: Repository[], 
    includePrivate: boolean = false
  ): Repository[] {
    if (includePrivate) {
      return repositories;
    }
    return repositories.filter(repo => !repo.isPrivate);
  }
}
```

### エラークラス設計

```typescript
// features/dataSource/errors/github-parse.error.ts
export class GitHubApiParseError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error | unknown | null = null,
    public readonly rawData: unknown = null
  ) {
    super(message);
    this.name = "GitHubApiParseError";
  }

  /**
   * デバッグ用の詳細情報を取得
   */
  getDebugInfo(): {
    message: string;
    originalError?: string;
    rawDataType: string;
    rawDataSample?: string;
  } {
    return {
      message: this.message,
      originalError: this.originalError instanceof Error 
        ? this.originalError.message 
        : String(this.originalError),
      rawDataType: typeof this.rawData,
      rawDataSample: this.rawData 
        ? JSON.stringify(this.rawData).substring(0, 200) + "..."
        : undefined,
    };
  }
}
```

## 実装パターンの利点

### 1. **ランタイム型安全性の確保**

```typescript
// ❌ 従来パターン（as キャスト）
const repository = apiData as Repository; // ランタイム検証なし

// ✅ 新パターン（Zod + Parser）
const repository = GitHubApiParser.parseRepository(apiData); // ランタイム検証あり
```

### 2. **データソース独立性**

```typescript
// 将来的に他のAPIにも対応可能
export class GitLabApiParser {
  static parseRepository(apiData: unknown): Repository {
    const gitlabRepo = gitlabRepositoryApiSchema.parse(apiData);
    // GitLabの形式から内部形式に変換
    return repositorySchema.parse({
      id: gitlabRepo.id,
      name: gitlabRepo.name,
      fullName: gitlabRepo.path_with_namespace, // GitLab固有フィールド
      // ...
    });
  }
}
```

### 3. **ビジネスルール検証**

```typescript
// Parser内でビジネスルールを適用
static parseRepository(apiData: unknown): Repository {
  const githubRepo = githubRepositoryApiSchema.parse(apiData);
  
  // ビジネスルール: アーカイブされたリポジトリは除外
  if (githubRepo.archived) {
    throw new GitHubApiParseError("Archived repositories are not supported");
  }
  
  // ビジネスルール: スター数の正規化
  const normalizedStarCount = Math.max(0, githubRepo.stargazers_count || 0);
  
  return repositorySchema.parse({
    // ...
    starCount: normalizedStarCount,
  });
}
```

### 4. **構造化されたエラーハンドリング**

```typescript
// サービス層での使用例
export class GitHubRepoService {
  async fetchRepository(repoId: string): Promise<Repository> {
    try {
      const apiData = await this.githubApi.getRepository(repoId);
      return GitHubApiParser.parseRepository(apiData);
    } catch (error) {
      if (error instanceof GitHubApiParseError) {
        this.logger.error("GitHub API parse error", error.getDebugInfo());
        throw new ServiceError("Failed to process repository data", error);
      }
      throw error;
    }
  }
}
```

### 5. **テスタビリティの向上**

```typescript
// Parser単体でのテスト
describe("GitHubApiParser", () => {
  describe("parseRepository", () => {
    test("正常なGitHub APIレスポンスをパースできる", () => {
      const githubApiData = {
        id: 123,
        name: "test-repo",
        full_name: "user/test-repo",
        private: false,
        stargazers_count: 100,
        // ...
      };

      const result = GitHubApiParser.parseRepository(githubApiData);

      expect(result).toEqual({
        id: 123,
        name: "test-repo",
        fullName: "user/test-repo",
        isPrivate: false,
        starCount: 100,
        // ...
      });
    });

    test("不正なデータでエラーをスローする", () => {
      const invalidData = { invalid: "data" };

      expect(() => {
        GitHubApiParser.parseRepository(invalidData);
      }).toThrow(GitHubApiParseError);
    });
  });
});
```

## ファイル構成

```
features/dataSource/
├── schemas/                # Zodスキーマ定義（Coreスキーマ + API固有スキーマ）
│   ├── repository.schema.ts
│   ├── pull-request.schema.ts
│   ├── issue.schema.ts
│   └── release.schema.ts
├── parsers/                # データ変換クラス
│   ├── github-api.parser.ts
│   └── __tests__/
│       └── github-api.parser.test.ts
├── errors/                 # カスタムエラークラス
│   ├── github-parse.error.ts
│   └── github-api.error.ts
├── types/                  # 残存する型定義（API Options等）
│   └── api-options.ts
└── services/
    ├── __tests__/          # テスト(.tsファイルと同じ階層に__tests__フォルダを作成する)
    │   └── github-repo.service.test.ts
    └── github-repo.service.ts  # Parser使用例

注意: features/<feature>/types.ts は削除済み
→ z.infer<typeof schema> による型推論を使用
```

## 依存性注入パターン

### サービス層での依存性注入

```typescript
// features/users/services/index.ts - サービス統合・依存性注入
import { UserRepository } from "../repositories/user.repository";
import { UserPreferenceRepository } from "../repositories/user-preference.repository";
import { UserProfileService } from "./user-profile.service";
import { UserPreferenceService } from "./user-preference.service";

// 依存性注入によるサービス初期化
export const userProfileService = new UserProfileService(new UserRepository());
export const userPreferenceService = new UserPreferenceService(
  new UserPreferenceRepository()
);

// テスト用のファクトリ関数
export const createUserProfileService = (
  userRepository: UserRepository
) => new UserProfileService(userRepository);
```

### 分割されたサービス層の実装

```typescript
// features/users/services/user-profile.service.ts
import { UserRepository } from "../repositories/user.repository";
import type { CreateUserRequest, UpdateUserRequest } from "../schemas/user.schema";
import type { User } from "../schemas/user.schema";

export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

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
```

## パフォーマンス考慮事項

### スキーマキャッシュ戦略

```typescript
// 大量データ処理時のスキーマ最適化
export class OptimizedGitHubApiParser {
  // スキーマのコンパイル済みバージョンをキャッシュ
  private static readonly compiledGitHubSchema = githubRepositoryApiSchema;
  private static readonly compiledRepositorySchema = repositorySchema;

  static parseRepositoryBatch(apiDataArray: unknown[]): Repository[] {
    // バッチ処理用の最適化されたパース
    return apiDataArray.map(item => {
      const githubRepo = this.compiledGitHubSchema.parse(item);
      const repository = this.transformToRepository(githubRepo);
      return this.compiledRepositorySchema.parse(repository);
    });
  }

  private static transformToRepository(githubRepo: GitHubRepositoryApi): Repository {
    // 変換ロジックの分離
    return {
      id: githubRepo.id,
      name: githubRepo.name,
      fullName: githubRepo.full_name,
      // ...
    };
  }
}
```

## 移行戦略

### 段階的な移行アプローチ

1. **Phase 1**: 新規機能でZod + Parserパターンを採用
2. **Phase 2**: 既存のCriticalパスをParserパターンに移行
3. **Phase 3**: 全てのAPIパース処理をParserパターンに統一
4. **Phase 4**: `as`キャストの完全排除

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [ファイル命名規則](./file-naming-conventions.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
- [テスト戦略](./testing-strategy.md)