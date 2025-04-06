import { AsyncLocalStorage } from 'async_hooks'
import { Prisma, PrismaClient } from '@prisma/client'
import { getPrismaClientInstance } from './app-prisma-client'
import type { DefaultArgs } from '@prisma/client/runtime/library'

export type TransactionAwarePrismaClient = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Prismaのトランザクション管理を行うクラス
 * AsyncLocalStorageを使用してリクエスト単位でのトランザクション状態を管理する
 */
export class TransactionManager {
  // トランザクションの状態を管理するためのAsyncLocalStorage
  private readonly defaultPrisma: PrismaClient

  private transactionPrisma: TransactionAwarePrismaClient | undefined =
    undefined

  constructor() {
    this.defaultPrisma = getPrismaClientInstance()
  }

  /**
   * トランザクションを実行する
   * @param fn トランザクション内で実行するコールバック関数
   * @returns コールバック関数の実行結果
   */
  async transaction<T>(
    fn: (prisma: TransactionAwarePrismaClient) => Promise<T>,
  ): Promise<T> {
    // すでにトランザクション内の場合は、ネストせずに既存のトランザクションを使用
    if (this.transactionPrisma) {
      return await fn(this.transactionPrisma)
    }

    // 新しいトランザクションを開始
    return this.defaultPrisma.$transaction(async (prisma) => {
      this.transactionPrisma = prisma
      try {
        return await fn(prisma)
      } finally {
        this.transactionPrisma = undefined
      }
    })
  }

  /**
   * 現在のコンテキストに応じた適切なPrismaインスタンスを取得する
   * トランザクション内ならトランザクション用のインスタンス、
   * トランザクション外なら通常のインスタンスを返す
   */
  getActivePrisma(): TransactionAwarePrismaClient {
    return this.transactionPrisma ?? this.defaultPrisma
  }
}

// グローバルなTransactionManagerインスタンスを保存するAsyncLocalStorage
const managerStorage = new AsyncLocalStorage<{
  transactionManager: TransactionManager
}>()

/**
 * 現在のコンテキストに関連付けられたTransactionManagerインスタンスを取得する
 * コンテキストにインスタンスがない場合は、グローバルなインスタンスを返す
 */
export function getTransactionManager(): TransactionManager {
  // AsyncLocalStorageから現在のコンテキストに設定されたTransactionManagerを取得
  const store = managerStorage.getStore()

  if (!store) {
    throw new Error('TransactionManager is not set in the current context')
  }

  return store.transactionManager
}

/**
 * トランザクションマネージャーをAsyncLocalStorageに設定して関数を実行する
 * 主にミドルウェアで使用される
 */
export function runWithTransactionManager<T>(
  fn: () => T | Promise<T>,
): T | Promise<T> {
  const transactionManager = new TransactionManager()
  return managerStorage.run(
    {
      transactionManager,
    },
    fn,
  )
}
