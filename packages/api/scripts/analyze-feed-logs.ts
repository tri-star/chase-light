import { handler } from '@/handlers/step-functions/feed-analyzer/handlers/analyze-feed-log-handler'
import type { Context, SQSRecord } from 'aws-lambda'

if (process.env.STAGE !== 'local') {
  throw new Error('環境変数 STAGE=local を設定してください')
}
const feedLogId = process.argv[2]

if (!feedLogId) {
  throw new Error('feedLogIdが第1引数に必要です')
}

handler(
  {
    Records: [
      {
        receiptHandle: 'dummy',
        body: JSON.stringify({
          feedLogId: feedLogId,
        }),
      } as SQSRecord,
    ],
  },
  {} as Context,
)
