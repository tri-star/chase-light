# 定数管理ガイドライン

## ステータス

決定済み

## コンテキスト

TypeScript + Hono + Drizzle で構成されたAPIサーバーにおいて、数値、リスト、文字列などの値を定数化することで、保守性とコードの一貫性を向上させる必要がある。マジックナンバーやハードコードされた文字列の使用を防ぎ、変更時の影響範囲を最小化し、コードの可読性を高める。

### 主要な課題

- マジックナンバーや文字列リテラルの散在
- 同じ意味の値が複数箇所で重複定義
- 変更時の修正漏れによるバグの発生
- バリデーション制約やデフォルト値の管理の分散化
- 定数の命名規約と配置ルールの不統一

## 決定

### 採用する定数管理アプローチ

**機能単位での定数管理 + 一元化されたエクスポート**

機能ごとに`constants/`フォルダを作成し、用途別に定数ファイルを分類・管理する。関連する定数を物理的に近い場所に配置し、統一されたエクスポートパターンを採用する。

## 定数化の基本原則

### 1. 定数化すべき値の判定基準

**必須（MUST）**
- 数値リテラル（0, 1, -1 などの明白な値を除く）
- 文字列リテラル（空文字列 "" を除く）
- 配列・オブジェクトリテラル
- 正規表現パターン
- エラーメッセージ
- デフォルト値

**推奨（SHOULD）**
- APIのステータスコード（プロジェクト方針による）
- OpenAPI例の値（プロジェクト方針による）
- 環境固有の設定値

**例外（明示的に定数化不要）**
- Boolean値（`true`, `false`）
- 明白な数値（`0`, `1`, `-1`）
- 空文字列（`""`）
- `null`, `undefined`

### 2. 定数の命名規約

```typescript
// ✅ 推奨：UPPER_SNAKE_CASE + 意味のあるグループ化
export const USER_NAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  REQUIRED_ERROR_MESSAGE: "名前は必須です",
  MAX_LENGTH_ERROR_MESSAGE: "名前は100文字以内で入力してください",
} as const

export const DEFAULT_SETTINGS = {
  TIMEZONE: "Asia/Tokyo",
  LANGUAGE: "ja",
  NOTIFICATIONS: {
    EMAIL: true,
    PUSH: false,
  },
} as const

// ❌ 避ける：個別の定数定義
export const USER_NAME_MIN_LENGTH = 1
export const USER_NAME_MAX_LENGTH = 100
export const USER_NAME_REQUIRED_ERROR = "名前は必須です"
```

### 3. TypeScript型安全性の確保

```typescript
// ✅ as const アサーションの使用
export const SUPPORTED_LANGUAGES = ["ja", "en"] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number] // "ja" | "en"

// ✅ 読み取り専用配列の型注釈
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ["ja", "en"] as const

// ❌ 避ける：型安全性の欠如
export const SUPPORTED_LANGUAGES = ["ja", "en"] // string[]
```

## フォルダ構成と配置ルール

### 機能別定数フォルダ構造

```
features/[feature]/constants/
├── index.ts                    # エクスポートハブ
├── validation.ts              # バリデーション制約
├── defaults.ts                # デフォルト値
├── error-messages.ts          # エラーメッセージ（必要に応じて）
└── api-examples.ts            # OpenAPI例の値（必要に応じて）
```

### 実装例

#### バリデーション制約の定数化

```typescript
// features/user/constants/validation.ts

/**
 * ユーザー名制約
 * アプリケーション内でのユーザー表示名に関する制限
 */
export const USER_NAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  REQUIRED_ERROR_MESSAGE: "名前は必須です",
  MAX_LENGTH_ERROR_MESSAGE: "名前は100文字以内で入力してください",
} as const

/**
 * GitHubユーザー名制約
 * 外部の制約を参照する場合の例
 */
export { GITHUB_USERNAME } from "../../dataSource/constants/index.js"
```

#### デフォルト値の定数化

```typescript
// features/user/constants/defaults.ts

/**
 * サポート言語の定義
 */
export type SupportedLanguage = "ja" | "en"

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  "ja",
  "en",
] as const

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS = {
  TIMEZONE: "Asia/Tokyo",
  LANGUAGE: "ja" as SupportedLanguage,
  NOTIFICATIONS: {
    EMAIL: true,
    PUSH: false,
  },
} as const
```

#### エクスポートハブ

```typescript
// features/user/constants/index.ts

/**
 * User機能の定数エクスポート
 */
export { USER_NAME } from "./validation"
export {
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_SETTINGS,
} from "./defaults"
```

## 使用例とベストプラクティス

### APIルートでの使用

```typescript
// features/user/presentation/routes/profile/index.ts
import { USER_NAME } from "../../../constants/index.js"

const updateProfileRequestSchema = z.object({
  name: z
    .string()
    .min(USER_NAME.MIN_LENGTH, USER_NAME.REQUIRED_ERROR_MESSAGE)
    .max(USER_NAME.MAX_LENGTH, USER_NAME.MAX_LENGTH_ERROR_MESSAGE)
    .optional()
})
```

### サービス層での使用

```typescript
// features/user/services/user-settings.service.ts
import { DEFAULT_SETTINGS, SUPPORTED_LANGUAGES } from "../constants/index.js"

export class UserSettingsService {
  async resetUserSettings(userId: string): Promise<UserSettings | null> {
    await this.userRepository.update(userId, {
      timezone: DEFAULT_SETTINGS.TIMEZONE,
    })
    
    return {
      emailNotifications: DEFAULT_SETTINGS.NOTIFICATIONS.EMAIL,
      pushNotifications: DEFAULT_SETTINGS.NOTIFICATIONS.PUSH,
      language: DEFAULT_SETTINGS.LANGUAGE,
    }
  }
}
```

## 避けるべきパターン

### ❌ ハードコードされた値

```typescript
// ❌ 避ける
const schema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください")
})

const resetSettings = () => ({
  timezone: "Asia/Tokyo",
  language: "ja"
})
```

### ❌ 散在した定数定義

```typescript
// ❌ 避ける：複数ファイルで同じ値を定義
// file1.ts
const DEFAULT_TIMEZONE = "Asia/Tokyo"

// file2.ts  
const TIMEZONE_DEFAULT = "Asia/Tokyo"

// file3.ts
const timezone = "Asia/Tokyo"
```

### ❌ 型安全性の欠如

```typescript
// ❌ 避ける
export const LANGUAGES = ["ja", "en"] // string[]型になってしまう
export const STATUS_CODES = { OK: 200, ERROR: 500 } // プロパティが変更可能
```

## 既存コードへの適用

### 段階的なリファクタリング手順

1. **優先順位の決定**
   - 複数箇所で重複している値
   - バリデーション制約やエラーメッセージ
   - 設定やデフォルト値

2. **定数ファイルの作成**
   - 機能別に`constants/`フォルダを作成
   - 用途別にファイルを分類

3. **段階的な置換**
   - 1つの機能から開始
   - テストの実行とコミットを繰り返し
   - 他のチームメンバーとの調整

4. **継続的な改善**
   - コードレビューでの定数化チェック
   - 新機能開発時の定数化実装

### リファクタリング時の注意点

- 一度に大量の変更を行わない
- テストが通ることを確認してからコミット
- 機能別に段階的に実施
- チーム内での事前調整

## パフォーマンス考慮事項

### 定数の最適化

```typescript
// ✅ 推奨：値の事前計算
export const PAGINATION = {
  MIN_PAGE: 1,
  MAX_PAGE: 100,
  MIN_PER_PAGE: 1,
  MAX_PER_PAGE: 100,
  DEFAULT_PER_PAGE: 30,
  // 計算値も定数化
  MAX_OFFSET: 100 * 100, // MAX_PAGE * MAX_PER_PAGE
} as const

// ✅ 推奨：正規表現の事前コンパイル
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  GITHUB_USERNAME: /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
} as const
```

## 他の機能との連携

### 外部の定数参照

```typescript
// features/user/constants/validation.ts

// ✅ 他機能の定数を参照
import { GITHUB_USERNAME } from "../../dataSource/constants/index.js"

export const USER_VALIDATION = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  GITHUB_USERNAME, // 外部定数の再エクスポート
} as const
```

### 共通定数の管理

```typescript
// shared/constants/http-status.ts（必要に応じて）

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const
```

## コードレビューチェックリスト

- [ ] ハードコードされた数値・文字列が定数化されているか
- [ ] 定数名が意味を表現しており、命名規約に従っているか
- [ ] `as const` アサーションが適切に使用されているか
- [ ] 同じ意味の値が重複定義されていないか
- [ ] 定数が適切なフォルダ・ファイルに配置されているか
- [ ] エクスポート/インポートが統一されたパターンに従っているか
- [ ] 型安全性が確保されているか
- [ ] 必要に応じて JSDoc コメントが記述されているか

## 関連資料

- [フォルダ構成ガイドライン](./folder-structure.md)
- [APIルート実装ガイド](./api-implementation-guide.md)
- [アーキテクチャパターン](./architecture-patterns.md)
- [ファイル命名規則](./file-naming-conventions.md)

## 実装例の参考

- `packages/backend/src/features/dataSource/constants/` - GitHub制約の定数化例
- `packages/backend/src/features/user/constants/` - ユーザー機能の定数化例