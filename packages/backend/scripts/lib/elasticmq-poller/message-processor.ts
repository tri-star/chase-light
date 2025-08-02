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
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: "RequestResponse", // 同期実行
    })

    logger.debug(`Lambda関数を実行中: ${functionName}`, payload)

    const response = await this.lambdaClient.send(command)

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
   */
  private extractPayload(message: Message): unknown {
    if (!message.Body) {
      throw new Error("メッセージにBodyが含まれていません")
    }

    try {
      // SQSメッセージのBodyをJSONとしてパース
      const messageBody = JSON.parse(message.Body)

      // StepFunctionsから送信されたメッセージの場合、特定の形式になっている可能性がある
      // 基本的にはそのままLambdaに渡す
      return messageBody
    } catch (error) {
      // JSONパースに失敗した場合は、文字列のまま渡す
      logger.warn(
        "メッセージBodyのJSONパースに失敗しました。文字列として処理します。",
        error,
      )
      return { rawMessage: message.Body }
    }
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
