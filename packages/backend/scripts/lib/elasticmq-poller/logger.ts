/**
 * ElasticMQ Poller Logger
 */

// カラー付きログ設定
const colors = {
  info: "\x1b[34m[INFO]\x1b[0m",
  success: "\x1b[32m[SUCCESS]\x1b[0m",
  warn: "\x1b[33m[WARN]\x1b[0m",
  error: "\x1b[31m[ERROR]\x1b[0m",
  debug: "\x1b[90m[DEBUG]\x1b[0m",
} as const

/**
 * タイムスタンプ付きログ出力
 */
function formatMessage(
  level: keyof typeof colors,
  message: string,
  data?: unknown,
): string {
  const timestamp = new Date().toLocaleTimeString("ja-JP")
  let formattedMessage = `${colors[level]} ${timestamp} ${message}`

  if (data !== undefined) {
    if (data && typeof data === "object") {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`
    } else {
      formattedMessage += ` ${String(data)}`
    }
  }

  return formattedMessage
}

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(formatMessage("info", message, data))
  },

  success: (message: string, data?: unknown) => {
    console.log(formatMessage("success", message, data))
  },

  warn: (message: string, data?: unknown) => {
    console.warn(formatMessage("warn", message, data))
  },

  error: (message: string, data?: unknown) => {
    console.error(formatMessage("error", message, data))
  },

  debug: (message: string, data?: unknown) => {
    if (process.env.DEBUG) {
      console.log(formatMessage("debug", message, data))
    }
  },

  /**
   * 受信したメッセージを見やすい形式で出力
   */
  messageReceived: (
    queueName: string,
    messageBody: string,
    messageId?: string,
  ) => {
    console.log(
      formatMessage("info", `メッセージを受信しました (キュー: ${queueName})`),
    )
    if (messageId) {
      console.log(`  MessageId: ${messageId}`)
    }
    console.log("  内容:")
    try {
      const parsed = JSON.parse(messageBody)
      console.log(JSON.stringify(parsed, null, 4))
    } catch {
      console.log(`    ${messageBody}`)
    }
  },

  /**
   * Lambda実行結果を出力
   */
  lambdaResult: (
    functionName: string,
    success: boolean,
    result?: unknown,
    error?: Error,
  ) => {
    if (success) {
      console.log(
        formatMessage("success", `Lambda関数実行成功: ${functionName}`),
      )
      if (result) {
        logger.debug("Lambda実行結果", result)
      }
    } else {
      console.log(formatMessage("error", `Lambda関数実行失敗: ${functionName}`))
      if (error) {
        console.log(`  エラー: ${error.message}`)
        logger.debug("詳細エラー情報", error)
      }
    }
  },

  /**
   * ポーラー開始ログ
   */
  pollerStarted: (
    queueName: string,
    config: { pollIntervalMs: number; elasticMqEndpoint: string },
  ) => {
    console.log(formatMessage("success", "ElasticMQ Pollerを開始しました"))
    console.log(`  監視キュー: ${queueName}`)
    console.log(`  ElasticMQ: ${config.elasticMqEndpoint}`)
    console.log(`  ポーリング間隔: ${config.pollIntervalMs}ms`)
    console.log("")
    console.log("停止するには Ctrl+C を押してください")
    console.log("")
  },

  /**
   * ポーラー停止ログ
   */
  pollerStopped: () => {
    console.log("")
    console.log(formatMessage("info", "ElasticMQ Pollerを停止しました"))
  },
} as const
