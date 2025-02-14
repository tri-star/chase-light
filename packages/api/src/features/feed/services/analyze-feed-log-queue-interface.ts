import { z } from 'zod'

export const analyzeFeedLogMessageSchema = z.object({
  feedLogId: z.string(),
})
export type AnalyzeFeedLogMessage = z.infer<typeof analyzeFeedLogMessageSchema>

export interface AnalyzeFeedLogQueueInterface {
  send(message: AnalyzeFeedLogMessage): Promise<void>

  complete(receiptHandle: string): Promise<void>
}
