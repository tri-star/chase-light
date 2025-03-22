import { handler } from '@/handlers/step-functions/feed-analyzer/handlers/notify-update-handler'

if (process.env.STAGE !== 'local') {
  throw new Error('環境変数 STAGE=local を設定してください')
}

handler({})
