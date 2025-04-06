import { runWithTransactionManager } from '@/lib/prisma/transaction-manager'

export function withTransactionManager(callback: () => Promise<void>) {
  return () => runWithTransactionManager(async () => callback())
}
