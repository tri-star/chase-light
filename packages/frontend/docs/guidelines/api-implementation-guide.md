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

### 基本的なAPIルート実装例

#### 1. 認証不要のAPI

現時点では `@packages/frontend/server/api/auth/_login.get.ts` を参照。

TBD: 実装方法の詳細が決定後、どのファイルを参照するべきかを明記する

#### 2. 認証必須のAPI

以下のファイルを参照

- @packages/frontend/server/api/data-sources/index.get.ts
- @packages/frontend/server/api/data-sources/index.post.ts

## スキーマ検証戦略

- APIルートに渡された値は「境界を跨いで渡された値」であるため、Zodによる実行時も含めたスキーマ検証を行います。
  - ZodスキーマはOrvalが出力するスキーマを利用します。これは、 `packages/frontend/generated/api/zod/chaseLightAPI.zod.ts` で定義されています。
  - スキーマを利用したパース処理は、 `validateWithZod` ユーティリティ関数を使用します。
  - 実装例としては `@packages/frontend/server/api/data-sources/index.post.ts` を参照してください。

## エラーハンドリング

- エラー発生時はNuxt.jsのユーティリティ関数である `createError` を利用してエラーをスローし、同時に詳細情報を `console.error` でログ記録する方針とします。
- エラーの原因に応じてステータスコードを以下のように分けます。
  - ユーザー起因： 4XX (認証エラーの場合401など、適切なステータスコードを使用します)
  - サーバー起因： 5XX (内部エラーなど)
- エラーレスポンスには「ブラウザなど一般的なクライアントに返して差し支えない情報」を返すようにします。
  以下のような情報は極力レスポンスに含めないようにします。
  - 内部エラーのスタックトレース
  - 機密性の高い情報(トークン、パスワード)
- `createError` によるレスポンスには詳細情報を含めない代わりに、`console.error` のエラーには詳細情報を含め、「どのデータに関する処理でエラーが起きたのか」をトレース出来るようにすることを意識します。

## 認証統合

### セッション管理パターン

TBD: 実装を進めながら検討、拡充する

## テスト戦略

### APIルートのテスト方針

このプロジェクトでは、APIルートは以下の理由により**テストを記述しない**方針とします：

1. **橋渡し・整形が主目的**: Backend APIとフロントエンドの間のデータ変換が主な役割
2. **型チェックによる検知**: TypeScriptの型チェックにより、多くのエラーを開発時に検知可能
3. **ページレベルでのテスト**: 代わりに各ページのテストを記述し、APIとの統合を検証

## ベストプラクティス

TBD: 今後、実装を進めながら拡充を検討
