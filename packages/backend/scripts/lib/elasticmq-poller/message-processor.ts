/**
 * Message Processing Logic for ElasticMQ Poller
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { type Message } from "@aws-sdk/client-sqs"
import { type PollerConfig } from "./config.js"
import { logger } from "./logger.js"
import { Buffer } from "buffer"

export interface MessageProcessorResult {
  success: boolean
  functionName: string
  result?: unknown
  error?: Error
}

export class MessageProcessor {
  private lambdaClient: LambdaClient

  constructor(private config: PollerConfig) {
    // SAM Local用のLambdaクライアント設定
    this.lambdaClient = new LambdaClient({
      region: "us-east-1", // SAM Localではダミー値
      endpoint: config.samLocalEndpoint,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    })
  }

  /**
   * メッセージを処理してLambda関数を実行
   */
  async processMessage(message: Message): Promise<MessageProcessorResult> {
    try {
      // 事前に解決されたLambda関数名を使用
      const functionName = this.config.lambdaFunctionName

      // メッセージからペイロードを抽出
      const payload = this.extractPayload(message)

      // Lambda関数を実行
      const result = await this.invokeLambdaFunction(functionName, payload)

      logger.lambdaResult(functionName, true, result)

      return {
        success: true,
        functionName,
        result,
      }
    } catch (error) {
      const functionName = this.config.lambdaFunctionName
      const errorObj = error instanceof Error ? error : new Error(String(error))

      logger.lambdaResult(functionName, false, undefined, errorObj)

      return {
        success: false,
        functionName,
        error: errorObj,
      }
    }
  }

  /**
   * Lambda関数を実行
   */
  private async invokeLambdaFunction(
    functionName: string,
    payload: unknown,
  ): Promise<unknown> {
    // デバッグ用: 環境変数・設定を出力してSam CLI側でのregion未設定を確認しやすくする
    logger.debug("invokeLambdaFunction: env", {
      AWS_REGION: process.env.AWS_REGION,
      AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
      samLocalEndpoint: this.config.samLocalEndpoint,
    })

    const params = {
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: "RequestResponse", // 同期実行
    }

    logger.debug(`Lambda関数を実行中: ${functionName}`, { params, payload })

    let response
    try {
      const command = new InvokeCommand(params)
      response = await this.lambdaClient.send(command)
    } catch (err) {
      // LambdaClient 送信エラーを詳細ログで出す
      const errorObj = err instanceof Error ? err : new Error(String(err))
      logger.error(`LambdaClient.send エラー: ${functionName}`, errorObj)
      logger.debug("invokeLambdaFunction: client config", {
        endpoint: this.config.samLocalEndpoint,
        region: (this.lambdaClient as any).config?.region,
      })
      throw errorObj
    }

    // レスポンスの生データをデバッグ出力
    try {
      logger.debug("Lambda raw response", {
        StatusCode: response.StatusCode,
        FunctionError: response.FunctionError,
        Payload: response.Payload
          ? Buffer.from(response.Payload).toString()
          : undefined,
      })
    } catch (logErr) {
      logger.debug("Lambda raw response ログ時にエラーが発生しました", logErr)
    }

    // レスポンスを解析
    if (response.StatusCode !== 200) {
      throw new Error(`Lambda実行エラー: StatusCode=${response.StatusCode}`)
    }

    if (response.FunctionError) {
      const errorPayload = response.Payload
        ? JSON.parse(Buffer.from(response.Payload).toString())
        : "Unknown error"
      throw new Error(
        `Lambda関数エラー: ${response.FunctionError} - ${JSON.stringify(errorPayload)}`,
      )
    }

    // 成功時のレスポンスを返す
    if (response.Payload) {
      const result = JSON.parse(Buffer.from(response.Payload).toString())
      return result
    }

    return null
  }

  /**
   * SQSメッセージからLambda実行用のペイロードを抽出
   * AWS本番環境と同じSQSEvent形式にラップする
   */
  private extractPayload(message: Message): unknown {
    if (!message.Body) {
      throw new Error("メッセージにBodyが含まれていません")
    }

    // SQSEvent形式にラップ
    const sqsEvent = {
      Records: [
        {
          messageId: message.MessageId || crypto.randomUUID(),
          receiptHandle: message.ReceiptHandle || "",
          body: message.Body, // 元のメッセージBody（JSONパースせずそのまま）
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:local:000000000000:local-queue",
          awsRegion: "us-east-1",
        },
      ],
    }

    return sqsEvent
  }
}

/**
 * メッセージハンドラーファクトリー
 */
export function createMessageHandler(config: PollerConfig) {
  const processor = new MessageProcessor(config)

  return async (message: Message): Promise<void> => {
    const result = await processor.processMessage(message)

    if (!result.success) {
      throw result.error || new Error("メッセージ処理に失敗しました")
    }
  }
}
