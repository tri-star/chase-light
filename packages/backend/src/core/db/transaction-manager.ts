import { AsyncLocalStorage } from "node:async_hooks"
import { connectDb, db } from "../../db/connection"

type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * TransactionManager クラス
 *
 * AsyncLocalStorage を使用してトランザクション状態を管理し、
 * 透過的なトランザクション制御を提供する
 */
export class TransactionManager {
  private static asyncLocalStorage = new AsyncLocalStorage<TransactionType>()

  /**
   * 現在のデータベース接続を取得
   *
   * トランザクション内であればそのトランザクションを、
   * そうでなければ通常のデータベース接続を返す
   */
  static async getConnection(): Promise<typeof db | TransactionType> {
    const transaction = this.asyncLocalStorage.getStore()
    if (!transaction) {
      await connectDb()
      return db
    }
    return transaction
  }

  /**
   * トランザクションを実行
   *
   * @param callback トランザクション内で実行する処理
   * @returns callback の戻り値
   */
  static async transaction<T>(
    callback: (db: TransactionType) => Promise<T>,
  ): Promise<T> {
    // 既にトランザクション内の場合は、既存のトランザクションを継続
    const existingTransaction = this.asyncLocalStorage.getStore()
    if (existingTransaction) {
      return await callback(existingTransaction)
    }

    // 新しいトランザクションを開始
    return await db.transaction(async (tx) => {
      return await this.asyncLocalStorage.run(tx, async () => {
        return await callback(tx)
      })
    })
  }
}
