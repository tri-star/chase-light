# TransactionManager 作業方針

## 基本設計

TransactionManagerクラスは以下の機能を持ちます：

1. AsyncLocalStorageを利用したトランザクション状態の管理
2. Prismaと同様のインターフェースでトランザクションを実行する`transaction()`メソッド
3. 現在のコンテキストに応じた適切なPrismaインスタンスを返す`getActivePrisma()`メソッド

## 実装計画

### 1. TransactionManagerクラスの実装

以下のファイルを作成します：
- `packages/api/src/lib/prisma/transaction-manager.ts`
  - AsyncLocalStorageを利用したTransactionManagerクラスの実装
  - トランザクション状態の管理とPrismaインスタンスの提供

### 2. getTransactionManager関数の実装

- `packages/api/src/lib/prisma/get-transaction-manager.ts`
  - グローバルからTransactionManagerインスタンスを取得するためのユーティリティ関数

### 3. Honoミドルウェアの実装

- `packages/api/src/handlers/api-gateway/app/middlewares/transaction-middleware.ts`
  - リクエスト毎にAsyncLocalStorageを初期化するミドルウェア
  - トランザクションマネージャーの設定

### 4. テストの実装

- `packages/api/src/lib/prisma/tests/transaction-manager.test.ts`
  - 基本的な機能テスト
  - ネストしたトランザクションのテスト
  - エラーケースのテスト

## 実装手順

1. まず現在の実装を確認し、TransactionManagerクラスの基本構造を設計
2. TransactionManagerクラスとgetTransactionManager関数を実装
3. Honoミドルウェアを実装
4. テストコードを作成して機能を検証
5. 既存のコードとの互換性の確認

## 注意点

- AsyncLocalStorageの使用パターンを正しく実装すること
- ネストしたトランザクションの適切な処理
- エラー発生時の適切なロールバック処理の実装