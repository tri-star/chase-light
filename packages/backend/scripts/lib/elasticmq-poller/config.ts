/**
 * ElasticMQ Poller Configuration Management
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

dotenv.config()

// TypeScript設定インターフェース
export interface PollerConfig {
  elasticMqEndpoint: string
  samLocalEndpoint: string
  queueName: string
  lambdaFunctionName: string // Lambda関数名を事前に解決
  pollIntervalMs: number
  maxMessages: number
  waitTimeSeconds: number
}

export interface QueueConfig {
  [queueName: string]: {
    lambdaFunctionName: string
    pollInterval?: number
    enabled: boolean
  }
}

export interface LocalVariables {
  Variables: Record<string, string>
  ElasticMQ: {
    ExternalEndpoint: string
    InternalEndpoint: string
    AccountId: string
  }
  StepFunctionsLocal: {
    Endpoint: string
    Region: string
    DummyRoleArn: string
  }
  QueueConfig?: QueueConfig
}

export interface CommandLineArgs {
  queue?: string
  interval?: number
  help?: boolean
}

const samPort = process.env.SAM_LOCAL_PORT || "3002"
const elasticMqPort = process.env.ELASTICMQ_PORT || "9324"
// デフォルト設定
const DEFAULT_CONFIG: Omit<PollerConfig, "queueName" | "lambdaFunctionName"> = {
  elasticMqEndpoint: `http://localhost:${elasticMqPort}`,
  samLocalEndpoint: `http://localhost:${samPort}`,
  pollIntervalMs: 5000,
  maxMessages: 1,
  waitTimeSeconds: 20,
}

/**
 * コマンドライン引数を解析
 */
export function parseCommandLineArgs(args: string[]): CommandLineArgs {
  const result: CommandLineArgs = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case "--queue":
        if (i + 1 < args.length) {
          result.queue = args[++i]
        }
        break
      case "--interval":
        if (i + 1 < args.length) {
          const interval = parseInt(args[++i], 10)
          if (!isNaN(interval)) {
            result.interval = interval
          }
        }
        break
      case "--help":
      case "-h":
        result.help = true
        break
    }
  }

  return result
}

/**
 * local-variables.jsonファイルを読み込み
 */
export function loadLocalVariables(): LocalVariables {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const backendDir = path.resolve(__dirname, "../../../")
  const localVariablesPath = path.join(
    backendDir,
    "infrastructure/local-variables.json",
  )

  if (!fs.existsSync(localVariablesPath)) {
    throw new Error(`設定ファイルが見つかりません: ${localVariablesPath}`)
  }

  try {
    const content = fs.readFileSync(localVariablesPath, "utf8")
    return JSON.parse(content) as LocalVariables
  } catch (error) {
    throw new Error(
      `設定ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * 設定を作成
 */
export function createPollerConfig(args: CommandLineArgs): PollerConfig {
  const localVariables = loadLocalVariables()

  // キュー名の決定
  if (!args.queue) {
    throw new Error("--queue オプションでキュー名を指定してください")
  }

  // キュー設定の確認
  const queueConfig = localVariables.QueueConfig?.[args.queue]
  if (!queueConfig) {
    console.warn(
      `警告: キュー '${args.queue}' の設定が見つかりません。デフォルト設定を使用します。`,
    )
  }

  if (queueConfig && !queueConfig.enabled) {
    throw new Error(`キュー '${args.queue}' は無効化されています`)
  }

  // 設定を構築
  const config: PollerConfig = {
    ...DEFAULT_CONFIG,
    queueName: args.queue,
    lambdaFunctionName: getLambdaFunctionName(args.queue), // Lambda関数名を事前に解決
    elasticMqEndpoint:
      localVariables.ElasticMQ?.ExternalEndpoint ||
      DEFAULT_CONFIG.elasticMqEndpoint,
  }

  // コマンドライン引数またはキュー設定からポーリング間隔を決定
  if (args.interval) {
    config.pollIntervalMs = args.interval
  } else if (queueConfig?.pollInterval) {
    config.pollIntervalMs = queueConfig.pollInterval
  }

  return config
}

/**
 * 指定されたキューのLambda関数名を取得
 */
export function getLambdaFunctionName(queueName: string): string {
  const localVariables = loadLocalVariables()
  const queueConfig = localVariables.QueueConfig?.[queueName]

  if (queueConfig?.lambdaFunctionName) {
    return queueConfig.lambdaFunctionName
  }

  // デフォルトのマッピング（後方互換性のため）
  const defaultMapping: Record<string, string> = {
    "process-updates-queue": "ProcessUpdatesFunction",
  }

  const defaultFunctionName = defaultMapping[queueName]
  if (defaultFunctionName) {
    return defaultFunctionName
  }

  throw new Error(
    `キュー '${queueName}' に対応するLambda関数名が見つかりません`,
  )
}

/**
 * ヘルプメッセージを表示
 */
export function showHelp(): void {
  console.log("ElasticMQ Poller - ローカル開発環境用SQSキュー監視ツール")
  console.log("")
  console.log("使用方法:")
  console.log("  pnpm poller --queue <キュー名> [オプション]")
  console.log("  pnpx tsx elasticmq-poller.ts --queue <キュー名> [オプション]")
  console.log("")
  console.log("必須オプション:")
  console.log("  --queue <キュー名>     監視するSQSキュー名")
  console.log("")
  console.log("オプション:")
  console.log("  --interval <ミリ秒>    ポーリング間隔 (デフォルト: 5000)")
  console.log("  --help, -h            このヘルプを表示")
  console.log("")
  console.log("例:")
  console.log("  pnpm poller --queue process-updates-queue")
  console.log("  pnpm poller --queue other-queue --interval 3000")
  console.log("")
}
