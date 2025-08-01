/**
 * ElasticMQ Poller Core Logic
 */

import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, type Message } from '@aws-sdk/client-sqs'
import { logger } from './logger.js'
import { type PollerConfig } from './config.js'

export interface PollerResult {
  success: boolean
  messageCount: number
  error?: Error
}

export class ElasticMQPoller {
  private sqsClient: SQSClient
  private isRunning = false
  private pollingTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(private config: PollerConfig) {
    // ElasticMQ用のSQSクライアント設定
    this.sqsClient = new SQSClient({
      region: 'us-east-1', // ElasticMQではダミー値
      endpoint: config.elasticMqEndpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    })
  }

  /**
   * ポーリングを開始
   */
  async start(messageHandler: (message: Message) => Promise<void>): Promise<void> {
    if (this.isRunning) {
      logger.warn('ポーラーは既に実行中です')
      return
    }

    this.isRunning = true
    logger.pollerStarted(this.config.queueName, {
      pollIntervalMs: this.config.pollIntervalMs,
      elasticMqEndpoint: this.config.elasticMqEndpoint,
    })

    await this.pollMessages(messageHandler)
  }

  /**
   * ポーリングを停止
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId)
      this.pollingTimeoutId = null
    }
    logger.pollerStopped()
  }

  /**
   * メッセージのポーリングループ
   */
  private async pollMessages(messageHandler: (message: Message) => Promise<void>): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.receiveMessages()
        
        if (result.Messages && result.Messages.length > 0) {
          // メッセージを順次処理
          for (const message of result.Messages) {
            if (!this.isRunning) break
            
            try {
              await this.processMessage(message, messageHandler)
            } catch (error) {
              logger.error('メッセージ処理エラー', error)
              // メッセージ処理に失敗してもポーリングは継続
            }
          }
        } else {
          logger.debug('新しいメッセージはありません')
        }
      } catch (error) {
        logger.error('ポーリングエラー', error)
        
        // 接続エラーの場合は少し待ってからリトライ
        if (this.isConnectionError(error)) {
          logger.info(`${this.config.pollIntervalMs}ms後にリトライします...`)
        }
      }

      // 次のポーリングまで待機
      if (this.isRunning) {
        await this.sleep(this.config.pollIntervalMs)
      }
    }
  }

  /**
   * SQSからメッセージを受信
   */
  private async receiveMessages() {
    const queueUrl = `${this.config.elasticMqEndpoint}/000000000000/${this.config.queueName}`
    
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: this.config.maxMessages,
      WaitTimeSeconds: this.config.waitTimeSeconds,
      MessageAttributeNames: ['All'],
    })

    logger.debug(`メッセージ受信を試行中: ${queueUrl}`)
    return await this.sqsClient.send(command)
  }

  /**
   * 個別メッセージの処理
   */
  private async processMessage(message: Message, messageHandler: (message: Message) => Promise<void>): Promise<void> {
    if (!message.Body) {
      logger.warn('メッセージにBodyが含まれていません', message)
      return
    }

    // メッセージ受信をログ出力
    logger.messageReceived(this.config.queueName, message.Body, message.MessageId)

    try {
      // メッセージハンドラーを実行
      await messageHandler(message)
      
      // 処理成功時はメッセージを削除
      await this.deleteMessage(message)
      logger.success('メッセージ処理が完了しました')
      
    } catch (error) {
      logger.error('メッセージ処理に失敗しました', error)
      
      // 処理失敗時もメッセージを削除（無限ループを防ぐため）
      await this.deleteMessage(message)
      throw error // エラーを再スロー
    }
  }

  /**
   * 処理済みメッセージをキューから削除
   */
  private async deleteMessage(message: Message): Promise<void> {
    if (!message.ReceiptHandle) {
      logger.warn('メッセージにReceiptHandleが含まれていません')
      return
    }

    const queueUrl = `${this.config.elasticMqEndpoint}/000000000000/${this.config.queueName}`
    
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle,
    })

    try {
      await this.sqsClient.send(command)
      logger.debug('メッセージを削除しました', { messageId: message.MessageId })
    } catch (error) {
      logger.error('メッセージ削除に失敗しました', error)
      // 削除失敗は致命的ではないので、エラーをスローしない
    }
  }

  /**
   * 接続エラーかどうかを判定
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('ECONNREFUSED') || 
             error.message.includes('ENOTFOUND') ||
             error.message.includes('timeout')
    }
    return false
  }

  /**
   * 指定時間待機
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.pollingTimeoutId = setTimeout(resolve, ms)
    })
  }
}