# タスク概要

PrismaのTransactionManagerを導入する。

現在、このプロジェクトではPrismaを扱う際、getPrismaClientInstance() という関数を利用して
Prismaのインスタンスを取得することになっています。

ただしこの方法は、Prismaのトランザクションを扱うケースで問題があります。

今回のタスクではこの問題への対処の一環として、TransactionManagerクラスを作成します。
(このクラスを利用した横展開は別タスクです)

## 問題点

Prismaではトランザクションを扱う際、以下のような書き方をします。

```typescript
const prisma = getPrismaClientInstance()
const result = await prisma.$transaction(async (inTransactionPrisma) => {
  // トランザクション内の処理
})
```

トランザクションの中では上記の `inTransactionPrisma` を参照する必要があり、ソースコード中の各所で
getPrismaClientInstanceを参照していると誤ったPrismaインスタンスを参照してしまうことになります。

## 現在の想定

TransactionManagerを導入することにより、以下のように解決しようと考えています。

- Honoアプリケーションのミドルウェア内でAsyncLocalStorageを初期化。
- AsyncLocalStorage内にTransactionManagerクラスのインスタンスを記録することでリクエスト毎に独立したインスタンスを持つようにします。
  - ソースコードの各所では、 getTransactionManager() のような関数でグローバルにインスタンスを取得できるようにします。
- TransactionManagerクラスはPrismaと同じようなインターフェースのtransaction()メソッドを持ち、引数にコールバック関数を受け取ります。
  - コールバック関数の第1引数に正しいPrismaインスタンスを渡すことで、アプリケーション内で正しいインスタンスを参照できるようにします。
- また、TransactionManagerはgetActivePrisma()メソッドを持ち、トランザクション内/外に応じて適切なPrismaインスタンスを返すメソッドも持ちます。
  - アプリケーション内の関数からは現在トランザクションの中/外のどちらか判断は付かないので、これからはTransactionManager.getActivePrisma()を利用してPrismaインスタンスを取得する場面が多くなる想定です。

# 作業内容

- [x] TransactionManagerクラスを作成する
  - AsyncLocalStorageを利用してトランザクションの状態を管理する実装
  - getActivePrisma()メソッドの実装（トランザクション内/外に応じた適切なPrismaインスタンスを返す）
  - transaction()メソッドの実装（Prismaと同様のインターフェース）
- [x] getTransactionManager()関数の実装
  - グローバルにTransactionManagerインスタンスを取得できる関数
- [x] Honoアプリケーションのミドルウェアの実装
  - リクエスト毎にAsyncLocalStorageを初期化
  - TransactionManagerインスタンスをAsyncLocalStorageに設定
- [x] テストコードの作成
  - TransactionManagerの基本的な動作確認テスト
  - ネストしたトランザクションの動作確認テスト
  - エラー時のロールバック動作確認テスト

# 関連情報

- packages/api/src/lib/prisma/app-prisma-client.ts 現在のgetPrismaClientInstanceが定義されているファイル
- packages/api/src/lib/prisma: ここにTransactionManagerクラスを作成
