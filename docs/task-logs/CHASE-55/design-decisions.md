# CHASE-55: ユーザー登録API - 設計方針と技術判断

## 概要

CHASE-55「ユーザー管理API」の一環として、ユーザー登録APIの設計方針と技術的判断を記録する。

## 背景

### 要件
- Auth0経由のGitHub認証を通してユーザー登録
- 将来的にAuth0経由のID/PASSやGoogle認証も対応予定
- 必要な情報: GitHubアカウント名、Auth0のsub、メールアドレス
- フロントエンド側でセッション管理（トークン情報記録）

### 既存の認証基盤（CHASE-54実装済み）
- JWT認証システム完全実装済み
- Auth0統合とJWKS署名検証対応
- グローバル認証ミドルウェア適用済み
- IDトークンのnonce検証、sub等の抽出機能あり

## 設計方針の検討

### 選択肢1: IDトークンのみを受け取る方式（採用）

```typescript
POST /api/auth/signup
{
  "idToken": "eyJhbGciOiJSUzI1NiI..."
}
```

**メリット:**
- セキュリティが高い（IDトークンの署名検証でユーザー情報の正当性確保）
- シンプルな実装（既存のJWT検証サービスを活用）
- Auth0のnonce検証が確実に実行される
- 他の認証プロバイダー（Google等）追加時も同じパターン適用可能
- フロントエンド側の実装が単純

**デメリット:**
- バックエンド側でAuth0 APIを呼び出す可能性（ただし基本的にIDトークンに情報含まれる）

### 選択肢2: フロントエンドでパースして個別パラメータで送信

```typescript
POST /api/auth/signup
{
  "githubUsername": "user123",
  "sub": "auth0|12345",
  "email": "user@example.com",
  "name": "User Name",
  "avatarUrl": "https://..."
}
```

**メリット:**
- APIの入力パラメータが明確
- バックエンド側の処理がシンプル

**デメリット:**
- セキュリティリスク（クライアント側で改竄可能）
- フロントエンド側の実装が複雑
- Auth0のIDトークン検証が不十分になる可能性
- nonce検証が抜ける恐れ

## 採用した設計

### APIエンドポイント

```typescript
POST /api/auth/signup

// Request
interface SignUpRequest {
  idToken: string;  // Auth0から受け取ったIDトークン
}

// Response (成功時)
interface SignUpResponse {
  user: {
    id: string;
    email: string;
    name: string;
    githubUsername?: string;
    avatarUrl: string;
    createdAt: string;
  };
  message: string;
}

// Response (既存ユーザーの場合)
interface ExistingUserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    githubUsername?: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
  alreadyExists: true;
}
```

### 処理フロー

1. **IDトークン検証**
   - 既存のJWT検証サービスを使用
   - Auth0の署名検証、nonce確認
   - ペイロードからユーザー情報抽出

2. **ユーザー情報抽出**
   ```typescript
   // IDトークンから抽出する情報
   {
     sub: "auth0|github|12345",        // Auth0のユーザーID
     email: "user@example.com",        // メールアドレス
     name: "User Name",                // 表示名
     picture: "https://...",           // アバター画像URL
     nickname: "username",             // GitHubユーザー名（通常）
   }
   ```

3. **重複チェック**
   - `auth0UserId`（sub）で既存ユーザーを検索
   - 存在する場合は既存ユーザー情報を返却（登録済み扱い）
   - **実装変更**: 当初の日付比較方式から事前存在確認方式に変更（信頼性向上）

4. **ユーザー作成**
   - 新規の場合はusersテーブルに挿入
   - UUIDv7をプライマリキーとして生成

### セキュリティ考慮事項

1. **IDトークン検証の徹底**
   - Auth0の公開鍵による署名検証
   - nonce、aud、iss、exp等の検証
   - 既存のJWT検証サービスを活用

2. **重複登録防止**
   - `auth0UserId`をユニークキーとして使用
   - データベースレベルでのユニーク制約

3. **入力値検証**
   - Zodスキーマによるバリデーション
   - IDトークンの形式チェック

4. **認証除外設定**
   - `/api/auth/signup`エンドポイントのみ認証除外（具体的なエンドポイント指定）
   - 広範囲除外によるセキュリティリスクを回避

## 実装方針

### 技術スタック
- **フレームワーク**: Hono + OpenAPI
- **バリデーション**: Zod
- **ORM**: Drizzle ORM
- **データベース**: PostgreSQL
- **認証**: 既存のAuth0統合基盤

### ファイル構成
```
packages/backend/src/features/auth/
├── services/
│   ├── auth-signup.service.ts          # 新規作成
│   └── jwt-validator.service.ts        # 既存（活用）
├── presentation/
│   ├── routes.ts                       # signupルート追加
│   └── schemas.ts                      # signupスキーマ追加
└── __tests__/                          # テスト追加
```

### データベース設計
既存の`users`テーブルを活用:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth0_user_id TEXT NOT NULL UNIQUE,  -- Auth0のsub
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  github_username TEXT,                 -- GitHubユーザー名
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 将来の拡張性

### 他認証プロバイダー対応
- Google、Microsoft等のOAuth2プロバイダー
- 同じIDトークンベースの仕組みで対応可能
- Auth0のConnection設定で追加

### プロフィール情報の拡張
- GitHubのPublic Profile情報の自動取得
- 組織情報、リポジトリ情報の関連付け

### 段階的認証
- メール認証の追加
- 2FA設定の促進

## 開発・テスト方針

### テスト戦略
1. **ユニットテスト**: サービス層の各機能
2. **統合テスト**: API全体の動作確認
3. **E2Eテスト**: フロントエンドからの実際の登録フロー

### ログ・モニタリング
- ユーザー登録イベントのログ記録
- 重複登録試行の監視
- Auth0トークン検証エラーの追跡

## まとめ

**採用理由:**
1. **セキュリティ**: IDトークン検証により改竄を防止
2. **シンプルさ**: 既存認証基盤の活用で実装コスト削減
3. **拡張性**: 他認証プロバイダーへの対応が容易
4. **保守性**: 認証ロジックの一元化

## 実装完了事項（2024年末時点）

### ✅ 完了した実装
1. **コアサービス実装**
   - `AuthSignupService`: ユーザー登録ビジネスロジック
   - 新規ユーザー判定の改善（日付比較→事前存在確認）
   - GitHubユーザー名抽出ロジック

2. **API層実装**
   - `/api/auth/signup` エンドポイント
   - OpenAPI仕様書対応
   - Zodスキーマ定義

3. **型安全性向上**
   - `AuthErrorHttpStatus`型定義（400|401|500）
   - HTTPステータスコードの型安全な使用
   - エラーハンドリングの統一

4. **セキュリティ強化**
   - 認証除外設定の具体化（/api/auth/ → /api/auth/signup）
   - MISSING_CLAIMSエラーのステータス修正（401→400）

5. **テスト完備**
   - ユニットテスト：172件すべて成功
   - 統合テスト：APIエンドポイント全パターン
   - エラーケース網羅

### ❌ 未完了の受け入れ条件（残作業）

#### 1. **プロフィール取得・更新API** - 🚨 必須
**受け入れ条件**: プロフィール取得・更新が動作している

```typescript
// GET /api/users/profile - プロフィール取得
interface ProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    githubUsername?: string;
    avatarUrl: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  };
}

// PUT /api/users/profile - プロフィール更新
interface ProfileUpdateRequest {
  name?: string;
  githubUsername?: string;
  timezone?: string;
}
```

#### 2. **ユーザー設定API** - 🚨 必須
**受け入れ条件**: 設定変更機能が動作している

```typescript
// GET /api/users/settings - 設定取得
interface UserSettingsResponse {
  settings: {
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
  };
}

// PUT /api/users/settings - 設定更新
interface UserSettingsUpdateRequest {
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  language?: string;
}
```

### 🔄 実装中/後回し事項
1. **構造化ログ対応**
   - console.log/console.errorの置き換え
   - Plane上でタスク管理中（CHASE-XXX作成済み）

2. **フロントエンド統合**
   - Nuxt3側での呼び出し実装
   - セッション管理との連携

### 📊 技術的な学び・判断
1. **新規ユーザー判定方式の変更**
   - 当初：createdAt/updatedAtの比較（1秒差）
   - 変更後：事前のfindByAuth0Id()による存在確認
   - 理由：タイミング依存の不確実性を排除

2. **HTTPステータスコード設計**
   - 型安全性を重視してリテラル型を採用
   - クライアント要求エラー（400）とサーバー認証エラー（401）の明確な分離

3. **認証除外の最小権限原則**
   - 広範囲除外（/api/auth/*）から具体的エンドポイント指定に変更
   - 将来的な認証必須エンドポイント追加時の安全性確保

## 🎯 CHASE-55受け入れ条件の達成状況

### ✅ 完了済み
- [x] ユーザー登録APIが動作している
- [x] Auth0との連携が適切に実装されている
- [x] ログイン時はIDトークンのnonceも含めて検証している
- [x] subなどユーザーを特定する値はIDトークンから取得している
- [x] テストが実装されている

### ❌ 未完了（必須実装項目）
- [ ] **プロフィール取得・更新が動作している**
  - GET `/api/users/profile` 
  - PUT `/api/users/profile`
- [ ] **設定変更機能が動作している**
  - GET `/api/users/settings`
  - PUT `/api/users/settings`

### 📋 実装TODO（優先度順）
1. **高優先度**: ユーザー管理API実装
   - `UserService`、`UserRepository`作成
   - `/api/users/profile` GET/PUT エンドポイント
   - `/api/users/settings` GET/PUT エンドポイント
   - 認証済みユーザーのみアクセス可能
   
2. **中優先度**: データベース拡張
   - `user_settings`テーブル追加検討
   - 設定項目のスキーマ定義
   
3. **低優先度**: フロントエンド統合
   - Nuxt3での認証状態管理
   - プロフィール・設定画面実装

**CHASE-55完了には1番の実装が必須です。**