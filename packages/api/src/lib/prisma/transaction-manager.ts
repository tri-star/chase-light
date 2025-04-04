// filepath: /home/tristar/projects/chase-light/packages/api/src/lib/prisma/transaction-manager.ts
import { AsyncLocalStorage } from 'async_hooks'
import { PrismaClient } from '@prisma/client'
import { getPrismaClientInstance } from './app-prisma-client'

/**
 * トランザクション状態を表すインターフェース
 */
interface TransactionState {
  prisma: PrismaClient
  isInTransaction: boolean
}

/**
 * Prismaのトランザクション管理を行うクラス
 * AsyncLocalStorageを使用してリクエスト単位でのトランザクション状態を管理する
 */
export class TransactionManager {
  // トランザクションの状態を管理するためのAsyncLocalStorage
  private readonly transactionStorage: AsyncLocalStorage<TransactionState>
  private readonly defaultPrisma: PrismaClient

  constructor() {
    this.transactionStorage = new AsyncLocalStorage<TransactionState>()
    this.defaultPrisma = getPrismaClientInstance()
  }

  /**
   * トランザクションを実行する
   * @param fn トランザクション内で実行するコールバック関数
   * @returns コールバック関数の実行結果
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    const currentState = this.transactionStorage.getStore()

    // すでにトランザクション内の場合は、ネストせずに既存のトランザクションを使用
    if (currentState?.isInTransaction) {
      return fn(currentState.prisma)
    }

    // 新しいトランザクションを開始
    return this.defaultPrisma.$transaction(async (prisma) => {
      return this.transactionStorage.run(
        {
          prisma,
          isInTransaction: true,
        },
        async () => {
          return fn(prisma)
        }
      )
    })
  }

  /**
   * 現在のコンテキストに応じた適切なPrismaインスタンスを取得する
   * トランザクション内ならトランザクション用のインスタンス、
   * トランザクション外なら通常のインスタンスを返す
   */
  getActivePrisma(): PrismaClient {
    const state = this.transactionStorage.getStore()
    return state?.isInTransaction ? state.prisma : this.defaultPrisma
  }

  /**
   * リクエスト処理の開始時に呼び出し、トランザクション状態のコンテキストを初期化する
   * @param fn コンテキスト内で実行する関数
   */
  runWithTransactionState<T>(fn: () => T | Promise<T>): Promise<T> | T {
    return this.transactionStorage.run(
      {
        prisma: this.defaultPrisma,
        isInTransaction: false,
      },
      fn
    )
  }
}