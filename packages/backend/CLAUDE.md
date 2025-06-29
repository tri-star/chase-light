# Backend プロジェクト構成ガイド

このドキュメントは、TypeScript + Hono + Drizzle で構成されたAPIサーバーの開発ガイドです。

## プロジェクト概要

- **フレームワーク**: Hono (軽量Web framework)
- **言語**: TypeScript
- **ORM**: Drizzle ORM
- **データベース**: PostgreSQL
- **デプロイ**: ECS・Lambda両対応
- **認証**: Auth0統合

## 開発ガイドライン

本プロジェクトでは、以下のガイドラインに従って開発を進めてください：

### 📁 [フォルダ構成ガイドライン](docs/guidelines/folder-structure.md)
- Features-First Approach（機能優先アプローチ）
- コロケーションを重視したディレクトリ設計
- レイヤ別分割とサービス分割の原則

### 🏗️ [アーキテクチャパターン](docs/guidelines/architecture-patterns.md)
- Zod v4 + Parser Architecture
- 依存性注入パターン
- ランタイム型安全性の確保

### 🚀 [APIルート実装ガイド](docs/guidelines/api-implementation-guide.md)
- Honoフレームワークを使用したAPI実装
- スキーマコロケーション原則
- OpenAPI統合とエラーハンドリング

### 📝 [ファイル命名規則](docs/guidelines/file-naming-conventions.md)
- kebab-case.layer.ts パターン
- 機能名とレイヤ名の命名規則
- ESLint設定例

### 🧪 [テスト戦略](docs/guidelines/testing-strategy.md)
- Unit/Component Test の分類
- コロケーション原則に基づくテスト配置
- vitest + drizzle-seed を活用したテスト実装

## デプロイ構成

### マルチエントリポイント設計

ECSとLambda両方で動作するよう、以下の構成を採用：

```
src/
├── app.ts     # 共通Honoアプリケーション定義
├── lambda.ts  # Lambda用エントリポイント
├── server.ts  # ECS用HTTPサーバーエントリポイント
└── index.ts   # デフォルトエクスポート（Lambda）
```

### Lambda用エントリポイント

```typescript
// src/lambda.ts
import { handle } from "hono/aws-lambda";
import { app } from "./app";

export const handler = handle(app);
```

### ECS用HTTPサーバー

```typescript
// src/server.ts
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });
```

### デフォルトエクスポート

```typescript
// src/index.ts
export { handler } from "./lambda";
```

## データベース設計

@../../docs/adr/ADR004-database-schema.md に基づき、以下の原則を遵守します：

### Data Sourceパターン

- 将来のNPM対応を見据えたDataSourceパターンを採用
- `data_sources` ↔ `repositories` は1対1の関係
- UUIDv7をアプリケーション側で生成

### リポジトリ実装原則

```typescript
// 共通ベースクラス活用
export abstract class DrizzleBaseRepository<T> implements BaseRepository<T> {
  constructor(protected table: PgTable) {}
  // 共通CRUD操作を実装
}
```

## 継続的改善

### コードレビューチェックリスト

開発時は以下の項目を確認してください：

#### アーキテクチャ
- [ ] フォルダ構成が[フォルダ構成ガイドライン](docs/guidelines/folder-structure.md)に従っているか
- [ ] サービスが単一の責任を持っているか（100-300行程度）
- [ ] 依存性注入が適切に実装されているか
- [ ] [アーキテクチャパターン](docs/guidelines/architecture-patterns.md)に従ったParser設計になっているか

#### API実装
- [ ] [APIルート実装ガイド](docs/guidelines/api-implementation-guide.md)に従ったルート実装になっているか
- [ ] スキーマコロケーションが適切に行われているか
- [ ] Zodスキーマで適切にバリデーションが定義されているか
- [ ] エラーハンドリングが統一されているか

#### ファイル管理
- [ ] [ファイル命名規則](docs/guidelines/file-naming-conventions.md)に従っているか
- [ ] レイヤの役割が命名から判別できるか

#### テスト
- [ ] [テスト戦略](docs/guidelines/testing-strategy.md)に従ったテスト実装になっているか
- [ ] テストが適切にコロケーションされているか
- [ ] テストファイル名が`[対象ファイル名].test.ts`の命名規則に従っているか

#### 型安全性
- [ ] 型安全性が確保されているか（any型の濫用がないか）
- [ ] Zod + Parserパターンでランタイム型検証が実装されているか

### パフォーマンス考慮事項

- データベースクエリの最適化（N+1問題の回避）
- インデックス活用（schema.tsでの適切なindex定義）
- ページネーション実装
- キャッシュ戦略（必要に応じてRedis等の検討）

## トラブルシューティング

- Lintエラーの解決方法
  - @./docs/lint-error-troubleshooting.md 参照

## 参考資料

### フレームワーク・ライブラリ公式ドキュメント

- [Hono公式ドキュメント](https://hono.dev/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Zod公式ドキュメント](https://zod.dev/)

### プロジェクト内ドキュメント

- [ADR003: テスト戦略](../../docs/adr/ADR003-testing.md)
- [ADR004: データベーススキーマ設計](../../docs/adr/ADR004-database-schema.md)

## 追加リソース

- [Lint エラートラブルシューティング](docs/lint-error-troubleshooting.md)