// filepath: /home/tristar/projects/chase-light/packages/api/src/lib/prisma/get-transaction-manager.ts
import { AsyncLocalStorage } from 'async_hooks'
import { TransactionManager } from './transaction-manager'

// グローバルなTransactionManagerインスタンスを保存するAsyncLocalStorage
const managerStorage = new AsyncLocalStorage<TransactionManager>()

// デフォルトのTransactionManagerインスタンス
// AsyncLocalStorageにインスタンスがない場合に使用される
// テスト時の差し替え用
let fallbackTransactionManager: TransactionManager | undefined

/**
 * 現在のコンテキストに関連付けられたTransactionManagerインスタンスを取得する
 * コンテキストにインスタンスがない場合は、グローバルなインスタンスを返す
 */
export function getTransactionManager(): TransactionManager {
  // AsyncLocalStorageから現在のコンテキストに設定されたTransactionManagerを取得
  const manager = managerStorage.getStore()
  
  if (manager) {
    return manager
  }
  
  // コンテキストにTransactionManagerがない場合はフォールバック用のインスタンスを使用
  if (!fallbackTransactionManager) {
    fallbackTransactionManager = new TransactionManager()
  }
  
  return fallbackTransactionManager
}

/**
 * トランザクションマネージャーをAsyncLocalStorageに設定して関数を実行する
 * 主にミドルウェアで使用される
 */
export function runWithTransactionManager<T>(
  manager: TransactionManager,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return managerStorage.run(manager, fn)
}

/**
 * テスト用にフォールバック用のTransactionManagerインスタンスを差し替える
 */
export function setTransactionManagerForTest(manager: TransactionManager): void {
  fallbackTransactionManager = manager
}