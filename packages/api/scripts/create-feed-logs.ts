import { handler } from '@/handlers/step-functions/feed-analyzer/handlers/create-feed-logs'
import type { Context } from 'aws-lambda'

if (process.env.STAGE !== 'local') {
  throw new Error('環境変数 STAGE=local を設定してください')
}
const feedId = process.argv[2]

if (!feedId) {
  throw new Error('Feed ID must be provided as a command line argument')
}

handler(feedId, {} as Context)
