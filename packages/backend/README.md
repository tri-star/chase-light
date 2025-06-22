# Chase Light Backend API

Chase LightのバックエンドAPIサーバーです。Hono + TypeScript + OpenAPIを使用して構築されています。

## 🚀 クイックスタート

### 環境設定

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な設定を追加

# 開発サーバーの起動
pnpm dev
```

### 必要な環境変数

```bash
# .env
NODE_ENV=development
PORT=3001

# GitHub API integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# データベース (必要に応じて)
DATABASE_URL=postgresql://user:password@localhost:5432/chase_light
```

## 📚 API ドキュメント

### インタラクティブドキュメント

- **Scalar UI**: http://localhost:3001/scalar
- **OpenAPI JSON**: http://localhost:3001/doc

### 主要なAPIエンドポイント

#### GitHub API統合 (`/api/datasource`)

```bash
# Watch済みリポジトリ一覧
GET /api/datasource/repositories/watched

# リポジトリ詳細
GET /api/datasource/repositories/{owner}/{repo}

# リリース一覧
GET /api/datasource/repositories/{owner}/{repo}/releases

# プルリクエスト一覧  
GET /api/datasource/repositories/{owner}/{repo}/pulls

# イシュー一覧
GET /api/datasource/repositories/{owner}/{repo}/issues
```

詳細な仕様については [GitHub API統合ドキュメント](../../docs/api/github-integration.md) を参照してください。

## 🏗️ アーキテクチャ

### プロジェクト構成

```
src/
├── app.ts                    # アプリケーションエントリポイント
├── features/                 # 機能別実装
│   └── dataSource/          # GitHub API統合
│       ├── presentation/    # HTTP層 (routes, schemas)
│       ├── services/        # ビジネスロジック
│       ├── repositories/    # データアクセス (未実装)
│       ├── schemas/         # Zodスキーマ定義
│       ├── parsers/         # データ変換処理
│       ├── errors/          # カスタムエラークラス
│       └── types/           # TypeScript型定義
├── shared/                  # 共通ユーティリティ
│   └── utils/              # ヘルパー関数
└── db/                     # データベース関連 (将来拡張)
```

### 設計原則

- **機能別コロケーション**: 関連するコードを同一ディレクトリに配置
- **レイヤード・アーキテクチャ**: Presentation → Service → Repository の階層構造
- **型安全性**: TypeScript + Zod による実行時型検証
- **OpenAPI準拠**: 自動生成されるAPI仕様書

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ付き実行
pnpm test:coverage
```

### テスト構成

- **ユニットテスト**: サービス層とパーサーのテスト
- **統合テスト**: エンドポイント全体のテスト
- **スタブ**: GitHubAPIを使わないテスト環境

```
__tests__/
├── services/           # サービス層テスト
├── presentation/       # エンドポイントテスト
├── schemas/            # スキーマバリデーションテスト
└── parsers/            # データ変換テスト
```

## 🔧 開発

### 開発コマンド

```bash
# 開発サーバー (Hot Reload)
pnpm dev

# TypeScript型チェック
pnpm lint:type

# ESLint実行
pnpm lint

# コードフォーマット (Biome)
pnpm format

# ビルド
pnpm build

# 本番サーバー起動
pnpm start
```

### 開発ワークフロー

1. **機能開発**:
   ```bash
   # 機能ブランチ作成
   git checkout -b feature/your-feature-name
   
   # コード実装
   # - スキーマ定義 (schemas/)
   # - パーサー実装 (parsers/)
   # - サービス実装 (services/)
   # - エンドポイント実装 (presentation/)
   
   # テスト作成・実行
   pnpm test
   
   # リント・フォーマット
   pnpm lint && pnpm format
   ```

2. **コミット前チェック**:
   ```bash
   # 型チェック
   pnpm lint:type
   
   # テスト実行
   pnpm test
   
   # ビルド確認
   pnpm build
   ```

### 新機能追加ガイド

#### 1. 新しいGitHubAPIエンドポイント追加

```bash
# 1. スキーマ定義
src/features/dataSource/schemas/new-entity.schema.ts

# 2. パーサー実装
src/features/dataSource/parsers/github-api.parser.ts  # 拡張

# 3. サービス拡張
src/features/dataSource/services/github-repo.service.ts  # メソッド追加

# 4. エンドポイント実装
src/features/dataSource/presentation/routes/new-entity/
├── index.ts
└── __tests__/
    └── index.test.ts

# 5. ルーティング追加
src/features/dataSource/presentation/routes.ts  # route追加
```

#### 2. 新機能の実装例

```typescript
// schemas/new-entity.schema.ts
import { z } from "@hono/zod-openapi"

export const newEntitySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  // ... フィールド定義
}).openapi("NewEntity")

export type NewEntity = z.infer<typeof newEntitySchema>
```

```typescript
// services/github-repo.service.ts (メソッド追加)
async getNewEntity(owner: string, repo: string): Promise<NewEntity[]> {
  try {
    const response = await this.octokit.rest.repos.getNewEntity({
      owner,
      repo
    })
    
    return response.data.map(item => 
      GitHubApiParser.parseNewEntity(item)
    )
  } catch (error) {
    this.handleGitHubError(error, 'getNewEntity')
  }
}
```

## 🚀 デプロイ

### 環境別設定

#### 開発環境
```bash
NODE_ENV=development
PORT=3001
GITHUB_TOKEN=your_development_token
```

#### 本番環境
```bash
NODE_ENV=production
PORT=3000
GITHUB_TOKEN=your_production_token
```

### Docker対応

```dockerfile
# Dockerfile (例)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# ビルド & 実行
docker build -t chase-light-backend .
docker run -p 3000:3000 --env-file .env chase-light-backend
```

## 📊 監視とロギング

### ヘルスチェック

```bash
# ヘルスチェックエンドポイント
GET /health

# レスポンス例
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### ログ設定

```typescript
// 構造化ログの例
{
  "level": "info",
  "message": "GitHub API request successful",
  "endpoint": "/repositories/facebook/react",
  "duration": 150,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔒 セキュリティ

### セキュリティチェックリスト

- [ ] 環境変数でのシークレット管理
- [ ] 入力値バリデーション (Zod)
- [ ] レート制限対応
- [ ] CORS設定
- [ ] セキュリティヘッダー設定
- [ ] 機密情報のログ出力防止

### セキュリティ設定例

```typescript
// CORS設定
app.use('*', cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
  credentials: true
}))

// セキュリティヘッダー
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  await next()
})
```

## 🤝 コントリビューション

### 開発ガイドライン

1. **コーディング規約**: [ファイル命名規則](./docs/file-naming-conventions.md) に従う
2. **コミットメッセージ**: Conventional Commits形式を使用
3. **テスト**: 新機能には必ずテストを追加
4. **ドキュメント**: APIの変更時はドキュメントも更新

### プルリクエスト手順

1. Issue作成（バグ報告・機能要望）
2. 機能ブランチ作成
3. 実装・テスト作成
4. プルリクエスト作成
5. コードレビュー
6. マージ

## 📞 サポート

### 問題報告

- **バグ報告**: GitHub Issues
- **機能要望**: GitHub Issues
- **質問**: GitHub Discussions

### よくある問題

1. **認証エラー**: `GITHUB_TOKEN`の設定確認
2. **レート制限**: GitHub APIの制限確認
3. **型エラー**: TypeScriptの型定義確認

詳細なトラブルシューティングは [GitHub API統合ドキュメント](../../docs/api/github-integration.md#トラブルシューティング) を参照してください。

## 📄 ライセンス

このプロジェクトは MIT License の下で提供されています。

---

**開発チーム**: Chase Light Development Team  
**最終更新**: 2024年12月22日  
**バージョン**: v1.0.0
