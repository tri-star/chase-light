// filepath: /home/tristar/projects/chase-light/packages/api/src/lib/prisma/__tests__/transaction-manager.test.ts
import { describe, expect, it } from 'vitest'
import {
  TransactionManager,
  getTransactionManager,
  runWithTransactionManager,
  type TransactionAwarePrismaClient,
} from '../transaction-manager'
import { getPrismaClientInstance } from '../app-prisma-client'
import { randomUUID } from 'crypto'

describe('TransactionManager', () => {
  const createUser = async (
    prisma: TransactionAwarePrismaClient,
    name?: string,
  ) => {
    return prisma.user.create({
      data: {
        id: randomUUID().substring(0, 36),
        displayName: name || 'New User',
        accountName: `new-user-${randomUUID().substring(0, 8)}`,
        email: `new-${randomUUID().substring(0, 8)}@example.com`,
        emailVerified: true,
        providerId: 'test-provider',
      },
    })
  }

  // 各テストが終了すると、テスト用DBは自動的にリセットされます。
  describe('基本的な動作確認', () => {
    it('getActivePrismaがトランザクション外ではデフォルトのPrismaインスタンスを返す', async () => {
      await runWithTransactionManager(() => {
        const manager = getTransactionManager()
        const activePrisma = manager.getActivePrisma()
        const defaultPrisma = getPrismaClientInstance()

        expect(activePrisma).toBe(defaultPrisma)
      })
    })

    it('getActivePrismaがトランザクション内ではトランザクション用のPrismaインスタンスを返す', async () => {
      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()
        const defaultPrisma = getPrismaClientInstance()

        await manager.transaction(async (prisma) => {
          const activePrisma = manager.getActivePrisma()
          // トランザクション内のPrismaインスタンスはデフォルトのPrismaインスタンスとは異なるべき
          expect(activePrisma).not.toBe(defaultPrisma)
          // トランザクション内で得られるPrismaインスタンスと同じであるべき
          expect(activePrisma).toBe(prisma)
        })
      })
    })

    it('トランザクションの結果が正しく返される', async () => {
      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()

        const result = await manager.transaction(async () => {
          return 'test-result'
        })

        expect(result).toBe('test-result')
      })
    })
  })

  describe('トランザクションの実際のDB操作', () => {
    it('トランザクション内のDB操作が正常にコミットされる', async () => {
      const testName = `test-feed-${randomUUID().substring(0, 8)}`

      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()

        await manager.transaction(async (prisma) => {
          await createUser(prisma, testName)
        })

        // トランザクションの外からも作成したレコードが見えることを確認
        const defaultPrisma = manager.getActivePrisma()
        const user = await defaultPrisma.user.findFirst({
          where: { displayName: testName },
        })
        expect(user).not.toBeNull()
        expect(user?.displayName).toBe(testName)
      })
    })

    it('トランザクション内でエラーが発生すると、DB操作がロールバックされる', async () => {
      const testName = `test-rollback-user-${randomUUID().substring(0, 8)}`

      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()
        let defaultPrisma = manager.getActivePrisma()

        // トランザクション実行前にレコードが存在しないことを確認
        const beforeUser = await defaultPrisma.user.findFirst({
          where: { displayName: testName },
        })
        expect(beforeUser).toBeNull()

        // エラーが発生するトランザクションを実行
        await expect(
          manager.transaction(async (prisma) => {
            // レコードを作成
            await createUser(prisma, testName)

            // トランザクション内でレコードが作成されたことを確認
            const userInTx = await prisma.user.findFirst({
              where: { displayName: testName },
            })
            expect(userInTx).not.toBeNull()
            expect(userInTx?.displayName).toBe(testName)

            // エラーを発生させてロールバック
            throw new Error('Intentional transaction error')
          }),
        ).rejects.toThrow('Intentional transaction error')

        // トランザクションがロールバックされたため、レコードが存在しないことを確認
        defaultPrisma = manager.getActivePrisma()
        const afterUser = await defaultPrisma.user.findFirst({
          where: { displayName: testName },
        })
        expect(afterUser).toBeNull()
      })
    })
  })

  describe('ネストしたトランザクションの動作確認', () => {
    it('ネストしたトランザクションでは新しいトランザクションを作成せず、既存のトランザクションを再利用する', async () => {
      const outerName = `outer-user-${randomUUID().substring(0, 8)}`
      const innerName = `inner-user-${randomUUID().substring(0, 8)}`

      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()
        const defaultPrisma = manager.getActivePrisma()

        await manager.transaction(async (outerPrisma) => {
          // 外側のトランザクションでレコードを作成
          await createUser(outerPrisma, outerName)

          // 内側のトランザクションを実行
          await manager.transaction(async (innerPrisma) => {
            // 内側と外側で同じPrismaインスタンスであることを確認
            expect(innerPrisma).toBe(outerPrisma)

            // 内側のトランザクションでレコードを作成
            await createUser(innerPrisma, innerName)

            // 外側のトランザクションで作成したレコードが内側からも見えることを確認
            const outerUser = await outerPrisma.user.findFirst({
              where: { displayName: outerName },
            })
            expect(outerUser).not.toBeNull()
            expect(outerUser?.displayName).toBe(outerName)
          })

          // 内側のトランザクションで作成したレコードが外側からも見えることを確認
          const innerUser = await outerPrisma.user.findFirst({
            where: { displayName: innerName },
          })
          expect(innerUser).not.toBeNull()
          expect(innerUser?.displayName).toBe(innerName)
        })

        // 両方のトランザクションが完了後、レコードが存在することを確認
        const outerUser = await defaultPrisma.user.findFirst({
          where: { displayName: outerName },
        })
        const innerUser = await defaultPrisma.user.findFirst({
          where: { displayName: innerName },
        })
        expect(outerUser).not.toBeNull()
        expect(outerUser?.displayName).toBe(outerName)
        expect(innerUser).not.toBeNull()
        expect(innerUser?.displayName).toBe(innerName)
      })
    })

    it('内側のトランザクションでエラーが発生すると、外側のトランザクションも含めてすべてロールバックされる', async () => {
      const outerName = `outer-rollback-user-${randomUUID().substring(0, 8)}`
      const innerName = `inner-rollback-user-${randomUUID().substring(0, 8)}`

      await runWithTransactionManager(async () => {
        const manager = getTransactionManager()
        const defaultPrisma = manager.getActivePrisma()

        // トランザクション実行前にレコードが存在しないことを確認
        const beforeOuterUser = await defaultPrisma.user.findFirst({
          where: { displayName: outerName },
        })
        const beforeInnerUser = await defaultPrisma.user.findFirst({
          where: { displayName: innerName },
        })
        expect(beforeOuterUser).toBeNull()
        expect(beforeInnerUser).toBeNull()

        // エラーが発生するネストしたトランザクションを実行
        await expect(
          manager.transaction(async (outerPrisma) => {
            // 外側のトランザクションでレコードを作成
            await createUser(outerPrisma, outerName)

            // 内側のトランザクションを実行
            await manager.transaction(async (innerPrisma) => {
              // 内側のトランザクションでレコードを作成
              await createUser(innerPrisma, innerName)

              // エラーを発生させてロールバック
              throw new Error('Intentional nested transaction error')
            })
          }),
        ).rejects.toThrow('Intentional nested transaction error')

        // 両方のトランザクションがロールバックされたため、両方のレコードが存在しないことを確認
        const afterOuterUser = await defaultPrisma.user.findFirst({
          where: { displayName: outerName },
        })
        const afterInnerUser = await defaultPrisma.user.findFirst({
          where: { displayName: innerName },
        })
        expect(afterOuterUser).toBeNull()
        expect(afterInnerUser).toBeNull()
      })
    })
  })

  describe('TransactionManager関連関数のテスト', () => {
    it('runWithTransactionManagerでTransactionManagerがセットされる', async () => {
      await runWithTransactionManager(() => {
        const manager = getTransactionManager()
        expect(manager).toBeInstanceOf(TransactionManager)
      })
    })

    it('コンテキスト外でgetTransactionManagerを呼び出すとエラーになる', () => {
      expect(() => getTransactionManager()).toThrow(
        'TransactionManager is not set in the current context',
      )
    })
  })
})
