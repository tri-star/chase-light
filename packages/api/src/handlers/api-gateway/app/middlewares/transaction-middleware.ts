// filepath: /home/tristar/projects/chase-light/packages/api/src/handlers/api-gateway/app/middlewares/transaction-middleware.ts
import type { MiddlewareHandler } from 'hono'
import { TransactionManager } from '@/lib/prisma/transaction-manager'
import { runWithTransactionManager } from '@/lib/prisma/get-transaction-manager'

/**
 * トランザクション管理用のミドルウェア
 * リクエストごとにTransactionManagerのインスタンスを作成し、AsyncLocalStorageに設定
 */
export const transactionMiddleware: MiddlewareHandler = async (c, next) => {
  // リクエストごとに新しいTransactionManagerインスタンスを作成
  const transactionManager = new TransactionManager()
  
  // TransactionManagerをAsyncLocalStorageに設定し、その中でトランザクション状態の初期化も行う
  return runWithTransactionManager(transactionManager, async () => {
    return transactionManager.runWithTransactionState(async () => {
      await next()
    })
  })
}