// filepath: /home/tristar/projects/chase-light/packages/api/src/handlers/api-gateway/app/middlewares/transaction-middleware.ts
import type { MiddlewareHandler } from 'hono'
import { runWithTransactionManager } from '@/lib/prisma/transaction-manager'

/**
 * トランザクション管理用のミドルウェア
 * リクエストごとにTransactionManagerのインスタンスを作成し、AsyncLocalStorageに設定
 */
export const transactionMiddleware: MiddlewareHandler = async (c, next) => {
  // TransactionManagerをAsyncLocalStorageに設定し、その中でトランザクション状態の初期化も行う
  return runWithTransactionManager(async () => {
    await next()
  })
}
