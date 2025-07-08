# GitHubリポジトリ追加API設計検討（現在の実装準拠版）

## 検討対象

1. DataSource追加APIのインターフェース
2. GitHub APIを呼び出して情報を取得するサービスクラスの設計

## 現在の実装状況確認

### 既存アーキテクチャ

- **Features-First Approach**: 機能単位でのコロケーション
- **DataSourceパターン**: `data_sources` ↔ `repositories` 1対1関係
- **UUIDv7**: アプリケーション側で生成
- **Hono + @hono/zod-openapi**: OpenAPI統合
- **レイヤ別責任分離**: domain, services, repositories, presentation

### 既存DBスキーマ

既に以下のテーブルが実装済み：

- `data_sources`: sourceType='github_repository', sourceId='owner/repo'
- `repositories`: dataSourceId参照, githubId, fullName等
- `user_watches`: ユーザーの監視設定

## 1. DataSource追加API設計（既存実装準拠）

### フォルダ構成

```
packages/backend/src/features/data-source/
├── domain/
│   ├── data-source.ts          # DataSource型定義
│   ├── repository.ts           # Repository型定義
│   ├── user-watch.ts           # UserWatch型定義
│   └── __tests__/
├── services/
│   ├── data-source-creation.service.ts  # DataSource作成サービス
│   ├── github-api.service.ts             # GitHub API統合サービス
│   └── __tests__/
├── repositories/
│   ├── data-source.repository.ts
│   ├── repository.repository.ts
│   ├── user-watch.repository.ts
│   └── __tests__/
├── presentation/
│   ├── routes/
│   │   └── data-sources/
│   │       └── index.ts        # エンドポイント実装
│   ├── schemas/
│   │   └── data-source.schema.ts  # 共通スキーマ
│   └── routes.ts
├── constants/
│   └── validation.ts           # バリデーション定数
└── errors/
    └── github-api.error.ts     # GitHub API関連エラー
```

### APIエンドポイント設計

#### エンドポイント

```
POST /api/v1/data-sources
```

#### バリデーション定数

```typescript
// constants/validation.ts
export const GITHUB_OWNER = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 39,
  PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
  ERROR_MESSAGE: "GitHubユーザー名は1-39文字の英数字とハイフンのみ使用可能です",
} as const;

export const GITHUB_REPO = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  PATTERN: /^[a-zA-Z0-9._-]+$/,
  ERROR_MESSAGE:
    "リポジトリ名は1-100文字の英数字、ピリオド、ハイフン、アンダースコアのみ使用可能です",
} as const;
```

#### リクエスト（Zodスキーマ）

```typescript
// presentation/routes/data-sources/index.ts
import { GITHUB_OWNER, GITHUB_REPO } from "../../constants/validation";

// 将来拡張性を考慮したdiscriminatedUnion
const createDataSourceRequestSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("GITHUB_REPOSITORY").openapi({
        description: "データソースの種類",
        example: "GITHUB_REPOSITORY",
      }),
      owner: z
        .string()
        .min(GITHUB_OWNER.MIN_LENGTH)
        .max(GITHUB_OWNER.MAX_LENGTH)
        .regex(GITHUB_OWNER.PATTERN, GITHUB_OWNER.ERROR_MESSAGE)
        .openapi({
          description: "GitHubリポジトリの所有者",
          example: "facebook",
        }),
      repo: z
        .string()
        .min(GITHUB_REPO.MIN_LENGTH)
        .max(GITHUB_REPO.MAX_LENGTH)
        .regex(GITHUB_REPO.PATTERN, GITHUB_REPO.ERROR_MESSAGE)
        .openapi({
          description: "GitHubリポジトリ名",
          example: "react",
        }),
      monitorReleases: z.boolean().default(true).openapi({
        description: "リリースの監視を有効にするか",
      }),
      monitorPullRequests: z.boolean().default(false).openapi({
        description: "プルリクエストの監視を有効にするか",
      }),
      monitorIssues: z.boolean().default(false).openapi({
        description: "Issueの監視を有効にするか",
      }),
      notificationEnabled: z.boolean().default(true).openapi({
        description: "通知を有効にするか",
      }),
    }),
    // 将来のNPM対応
    // z.object({
    //   type: z.literal('NPM_PACKAGE'),
    //   packageName: z.string(),
    //   // NPM固有設定
    // }),
  ])
  .openapi("CreateDataSourceRequest");
```

#### レスポンス（既存スキーマ準拠）

```typescript
const dataSourceResponseSchema = z
  .object({
    dataSource: z.object({
      id: z.string().uuid(),
      sourceType: z.string(),
      sourceId: z.string(),
      name: z.string(),
      description: z.string(),
      url: z.string(),
      isPrivate: z.boolean(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    repository: z.object({
      id: z.string().uuid(),
      githubId: z.number(),
      fullName: z.string(),
      language: z.string().nullable(),
      starsCount: z.number(),
      forksCount: z.number(),
      openIssuesCount: z.number(),
      isFork: z.boolean(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    userWatch: z.object({
      watchReleases: z.boolean(),
      watchIssues: z.boolean(),
      watchPullRequests: z.boolean(),
      notificationEnabled: z.boolean(),
      addedAt: z.string().datetime(),
    }),
  })
  .openapi("CreateDataSourceResponse");
```

### Domain層設計（TypeScript type）

```typescript
// domain/data-source.ts
export type DataSource = {
  id: string;
  sourceType: string;
  sourceId: string;
  name: string;
  description: string;
  url: string;
  isPrivate: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// domain/repository.ts
export type Repository = {
  id: string;
  dataSourceId: string;
  githubId: number;
  fullName: string;
  language: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  isFork: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// domain/user-watch.ts
export type UserWatch = {
  id: string;
  userId: string;
  dataSourceId: string;
  notificationEnabled: boolean;
  watchReleases: boolean;
  watchIssues: boolean;
  watchPullRequests: boolean;
  addedAt: Date | null;
};
```

### Service層設計（DTO型使用）

```typescript
// services/data-source-creation.service.ts
import type { DataSource, Repository, UserWatch } from "../domain";

export type CreateDataSourceInputDto = {
  userId: string;
  type: "GITHUB_REPOSITORY";
  owner: string;
  repo: string;
  monitoringSettings: {
    releases: boolean;
    pullRequests: boolean;
    issues: boolean;
  };
  notificationEnabled: boolean;
};

export type CreateDataSourceOutputDto = {
  dataSource: DataSource;
  repository: Repository;
  userWatch: UserWatch;
};

export class DataSourceCreationService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private repositoryRepository: RepositoryRepository,
    private userWatchRepository: UserWatchRepository,
    private githubApiService: GitHubApiServiceInterface
  ) {}

  async createGitHubDataSource(
    input: CreateDataSourceInputDto
  ): Promise<CreateDataSourceOutputDto> {
    // sourceIdを構築（既存DBスキーマとの互換性のため）
    const sourceId = `${input.owner}/${input.repo}`;

    // 既存データソースの重複チェック
    const existingDataSource =
      await this.dataSourceRepository.findBySourceTypeAndId(
        "github_repository", // 小文字で既存DBスキーマに合わせる
        sourceId
      );

    if (existingDataSource) {
      // 既存の場合はUserWatchのみ追加
      const userWatch = await this.userWatchRepository.create({
        userId: input.userId,
        dataSourceId: existingDataSource.id,
        watchReleases: input.monitoringSettings.releases,
        watchIssues: input.monitoringSettings.issues,
        watchPullRequests: input.monitoringSettings.pullRequests,
        notificationEnabled: input.notificationEnabled,
      });

      const repository = await this.repositoryRepository.findByDataSourceId(
        existingDataSource.id
      );

      return {
        dataSource: existingDataSource,
        repository: repository!,
        userWatch,
      };
    }

    // GitHub APIから情報取得
    const githubRepo = await this.githubApiService.getRepository(
      input.owner,
      input.repo
    );

    // UUIDv7生成
    const dataSourceId = generateUuidV7();
    const repositoryId = generateUuidV7();
    const userWatchId = generateUuidV7();

    // DataSource作成
    const dataSource = await this.dataSourceRepository.create({
      id: dataSourceId,
      sourceType: "github_repository", // 小文字で既存DBスキーマに合わせる
      sourceId,
      name: githubRepo.fullName,
      description: githubRepo.description,
      url: `https://github.com/${sourceId}`,
      isPrivate: githubRepo.isPrivate,
    });

    // Repository作成
    const repository = await this.repositoryRepository.create({
      id: repositoryId,
      dataSourceId,
      githubId: githubRepo.githubId,
      fullName: githubRepo.fullName,
      language: githubRepo.language,
      starsCount: githubRepo.starsCount,
      forksCount: githubRepo.forksCount,
      openIssuesCount: githubRepo.openIssuesCount,
      isFork: githubRepo.isFork,
    });

    // UserWatch作成
    const userWatch = await this.userWatchRepository.create({
      id: userWatchId,
      userId: input.userId,
      dataSourceId,
      watchReleases: input.monitoringSettings.releases,
      watchIssues: input.monitoringSettings.issues,
      watchPullRequests: input.monitoringSettings.pullRequests,
      notificationEnabled: input.notificationEnabled,
    });

    return {
      dataSource,
      repository,
      userWatch,
    };
  }
}
```

## 2. GitHub APIサービス設計

### エラークラス実装

```typescript
// errors/github-api.error.ts
export class GitHubApiParseError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error | unknown | null = null,
    public readonly rawData: unknown = null
  ) {
    super(message);
    this.name = "GitHubApiParseError";
  }

  getDebugInfo(): {
    message: string;
    originalError?: string;
    rawDataType: string;
    rawDataSample?: string;
  } {
    return {
      message: this.message,
      originalError:
        this.originalError instanceof Error
          ? this.originalError.message
          : String(this.originalError),
      rawDataType: typeof this.rawData,
      rawDataSample: this.rawData
        ? JSON.stringify(this.rawData).substring(0, 200) + "..."
        : undefined,
    };
  }
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}
```

### GitHub APIサービス実装（Octokit使用）

```typescript
// services/github-api-service.interface.ts
export interface GitHubApiServiceInterface {
  getRepository(owner: string, repo: string): Promise<GitHubRepositoryDto>;
  validateRepository(owner: string, repo: string): Promise<boolean>;
}

export type GitHubRepositoryDto = {
  githubId: number;
  fullName: string;
  description: string;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  language: string | null;
  homepage: string | null;
  isFork: boolean;
  isPrivate: boolean;
};
```

```typescript
// services/github-api.service.ts
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import {
  GitHubApiError,
  GitHubApiParseError,
} from "../errors/github-api.error";
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryDto,
} from "./github-api-service.interface";

// GitHub APIレスポンスをパースするためのZodスキーマ
const githubRepositoryApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  watchers_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  homepage: z.string().nullable(),
  fork: z.boolean(),
  private: z.boolean(),
  owner: z.object({
    login: z.string(),
  }),
});

type GitHubRepositoryApiResponse = z.infer<typeof githubRepositoryApiSchema>;

export class GitHubApiService implements GitHubApiServiceInterface {
  private octokit: Octokit;

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken, // undefined for public repos
    });
  }

  async getRepository(
    owner: string,
    repo: string
  ): Promise<GitHubRepositoryDto> {
    try {
      const response = await this.octokit.repos.get({ owner, repo });

      // Zodでレスポンスを安全にパース・検証（Parser処理をサービス内で実行）
      const parsedData = githubRepositoryApiSchema.parse(response.data);

      return this.mapToDto(parsedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub repository APIレスポンスのパースに失敗しました",
          error,
          error.errors
        );
      }

      // プロジェクト固有のエラーにラップしてスロー
      throw new GitHubApiError(
        `Repository not found: ${owner}/${repo}`,
        error.status,
        error.response?.data
      );
    }
  }

  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepository(owner, repo);
      return true;
    } catch {
      return false;
    }
  }

  private mapToDto(data: GitHubRepositoryApiResponse): GitHubRepositoryDto {
    return {
      githubId: data.id,
      fullName: data.full_name,
      description: data.description || "",
      starsCount: data.stargazers_count,
      forksCount: data.forks_count,
      watchersCount: data.watchers_count,
      openIssuesCount: data.open_issues_count,
      language: data.language,
      homepage: data.homepage,
      isFork: data.fork,
      isPrivate: data.private,
    };
  }
}
```

### テスト用スタブ実装

```typescript
// services/__tests__/github-api.service.stub.ts
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryDto,
} from "../github-api-service.interface";
import { GitHubApiError } from "../../errors/github-api.error";

export class GitHubApiServiceStub implements GitHubApiServiceInterface {
  private repositories: Map<string, GitHubRepositoryDto> = new Map();

  setRepository(
    owner: string,
    repo: string,
    repository: GitHubRepositoryDto
  ): void {
    this.repositories.set(`${owner}/${repo}`, repository);
  }

  async getRepository(
    owner: string,
    repo: string
  ): Promise<GitHubRepositoryDto> {
    const key = `${owner}/${repo}`;
    const repository = this.repositories.get(key);
    if (!repository) {
      throw new GitHubApiError(`Repository not found: ${key}`, 404);
    }
    return repository;
  }

  async validateRepository(owner: string, repo: string): Promise<boolean> {
    return this.repositories.has(`${owner}/${repo}`);
  }
}
```

## 3. 依存性注入とサービス統合

```typescript
// services/index.ts
import { DataSourceRepository } from "../repositories/data-source.repository";
import { RepositoryRepository } from "../repositories/repository.repository";
import { UserWatchRepository } from "../repositories/user-watch.repository";
import { DataSourceCreationService } from "./data-source-creation.service";
import { GitHubApiService } from "./github-api.service";

// 依存性注入によるサービス初期化
export const githubApiService = new GitHubApiService(
  process.env.GITHUB_ACCESS_TOKEN // 環境変数から取得、undefined for public repos
);

export const dataSourceCreationService = new DataSourceCreationService(
  new DataSourceRepository(),
  new RepositoryRepository(),
  new UserWatchRepository(),
  githubApiService
);

// テスト用ファクトリ関数
export const createDataSourceCreationService = (
  githubService: GitHubApiServiceInterface
) =>
  new DataSourceCreationService(
    new DataSourceRepository(),
    new RepositoryRepository(),
    new UserWatchRepository(),
    githubService
  );
```

## 4. 認証方式とセキュリティ

### GitHub App方式（推奨）

- アプリケーション固有の短命アクセストークン
- レート制限が高い（5,000 requests/hour）
- プライベートリポジトリ対応可能
- Auth0との統合が必要

### 実装優先度

1. **Phase 1**: パブリックリポジトリのみ（認証なし）
2. **Phase 2**: GitHub App統合
3. **Phase 3**: Auth0連携

## 次のステップ

1. **即座に実装可能**: パブリックリポジトリ対応API
2. **中期**: GitHub App設定とAuth0統合
3. **長期**: プライベートリポジトリ対応
4. **テスト**: 各レイヤのユニットテスト実装
