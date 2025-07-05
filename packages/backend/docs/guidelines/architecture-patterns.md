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
```

## ファイル構成

```
features/dataSource/
├── domain/                 # ドメインエンティティの型定義（TypeScript type）
│   ├── repository.ts
│   ├── pull-request.ts
│   ├── issue.ts
│   └── release.ts
├── errors/                 # カスタムエラークラス
│   ├── github-parse.error.ts
│   └── github-api.error.ts
├── presentation/           # Controller層のHTTPスキーマ定義
│   └── schemas/
│       └── api-request.schema.ts
└── services/
    ├── __tests__/          # テスト(.tsファイルと同じ階層に__tests__フォルダを作成する)
    │   └── github-repo.service.test.ts
    └── github-repo.service.ts  # DTO型使用例

注意: features/<feature>/schemas/ は削除済み
→ ドメイン層はTypeScriptのtype、Controller層はZodスキーマを使用
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
export const createUserProfileService = (userRepository: UserRepository) =>
  new UserProfileService(userRepository);
```

### 分割されたサービス層の実装

```typescript
// features/users/services/user-profile.service.ts
import { UserRepository } from "../repositories/user.repository";
import type { User } from "../domain/user";

export type CreateUserInputDto = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
};

export type CreateUserOutputDto = User;

export type UpdateUserInputDto = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  timezone?: string;
};

export type UpdateUserOutputDto = User;

export class UserProfileService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: CreateUserInputDto): Promise<CreateUserOutputDto> {
    // プロフィール作成に特化したビジネスロジック
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("このメールアドレスは既に使用されています");
    }

    return this.userRepository.create(data);
  }

  async updateUserProfile(
    id: string,
    data: UpdateUserInputDto
  ): Promise<UpdateUserOutputDto | null> {
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

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [ファイル命名規則](./file-naming-conventions.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
- [テスト戦略](./testing-strategy.md)
