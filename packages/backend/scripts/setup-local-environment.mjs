#!/usr/bin/env node

/**
 * Chase Light StepFunctions Local統合セットアップスクリプト
 *
 * 機能:
 * - Docker Compose環境の起動 (PostgreSQL, ElasticMQ, StepFunctions Local)
 * - Lambda関数のビルド
 * - SAM Localの起動
 * - SQSキュー作成
 * - ステートマシン作成
 * - 統合されたヘルスチェック
 */

import { execSync, spawn } from "child_process"
import fs from "fs"
import path from "path"
import { setTimeout } from "timers"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BACKEND_DIR = path.dirname(__dirname)

// カラー付きログ設定
const colors = {
  info: "\x1b[34m[INFO]\x1b[0m",
  success: "\x1b[32m[SUCCESS]\x1b[0m",
  error: "\x1b[31m[ERROR]\x1b[0m",
  warn: "\x1b[33m[WARN]\x1b[0m",
}

const log = {
  info: (msg) =>
    console.log(`${colors.info} ${new Date().toLocaleTimeString()} ${msg}`),
  success: (msg) =>
    console.log(`${colors.success} ${new Date().toLocaleTimeString()} ${msg}`),
  error: (msg) =>
    console.log(`${colors.error} ${new Date().toLocaleTimeString()} ${msg}`),
  warn: (msg) =>
    console.log(`${colors.warn} ${new Date().toLocaleTimeString()} ${msg}`),
}

// 設定ファイル
const CONFIG = {
  aslTemplate: path.join(
    BACKEND_DIR,
    "infrastructure/repository-monitoring.asl.json",
  ),
  localVariables: path.join(BACKEND_DIR, "infrastructure/local-variables.json"),
  tempFile: path.join(
    BACKEND_DIR,
    "infrastructure/.repository-monitoring-local.tmp.json",
  ),
  stateMachineName: "repository-monitoring-local",
  awsRegion: "us-east-1",
  samPort: 3001,
  dbPort: process.env.DB_PORT || 5432,
}

// AWS環境変数設定
process.env.AWS_ACCESS_KEY_ID = "test"
process.env.AWS_SECRET_ACCESS_KEY = "test"
process.env.AWS_REGION = CONFIG.awsRegion

/**
 * コマンドライン引数の解析
 */
function parseArguments() {
  const args = process.argv.slice(2)
  const options = {
    clean: false,
    wait: false,
    help: false,
  }

  for (const arg of args) {
    switch (arg) {
      case "--clean":
        options.clean = true
        break
      case "--wait":
      case "-w":
        options.wait = true
        break
      case "--help":
      case "-h":
        options.help = true
        break
      default:
        log.warn(`未知のオプション: ${arg}`)
    }
  }

  return options
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log("Usage: node setup-local-environment.mjs [OPTIONS]")
  console.log("")
  console.log(
    "Chase Light StepFunctions Local統合開発環境をセットアップします。",
  )
  console.log("")
  console.log("OPTIONS:")
  console.log(
    "  --clean        既存のコンテナとボリュームを完全削除してから起動",
  )
  console.log(
    "  --wait, -w     開発環境起動後、フォアグラウンドで待機（Ctrl+Cで停止）",
  )
  console.log("                 ※オプションなしの場合はバックグラウンド実行")
  console.log("  --help, -h     このヘルプメッセージを表示")
  console.log("")
  console.log("EXAMPLES:")
  console.log(
    "  node setup-local-environment.mjs              # バックグラウンド実行",
  )
  console.log("  node setup-local-environment.mjs --clean      # クリーン起動")
  console.log(
    "  pnpm local:start --wait                       # フォアグラウンド実行",
  )
}

/**
 * サービスの起動確認
 */
async function checkService(url, serviceName, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(`curl -f "${url}" > /dev/null 2>&1`, { stdio: "ignore" })
      log.success(`${serviceName}の起動を確認しました`)
      return true
    } catch (_error) {
      if (i === maxRetries - 1) {
        log.error(`${serviceName}の起動確認に失敗しました`)
        return false
      }
      await sleep(2000)
    }
  }
  return false
}

/**
 * StepFunctions Localの起動確認（AWS CLI使用）
 */
async function checkStepFunctionsLocal(maxRetries = 30) {
  log.info("StepFunctions Localの起動を確認中...")
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(
        `aws stepfunctions list-state-machines --endpoint-url http://localhost:8083 --query 'stateMachines' --output text > /dev/null 2>&1`,
        { stdio: "ignore" },
      )
      log.success("StepFunctions Localの起動を確認しました")
      return true
    } catch (_error) {
      if (i === maxRetries - 1) {
        log.error("StepFunctions Localの起動確認に失敗しました")
        return false
      }
      await sleep(2000)
    }
  }
  return false
}

/**
 * ElasticMQの起動確認（AWS SQS CLI使用）
 */
async function checkElasticMQ(maxRetries = 30) {
  log.info("ElasticMQの起動を確認中...")
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(
        `aws --region ${CONFIG.awsRegion} --endpoint-url http://localhost:9324 sqs list-queues --query 'QueueUrls' --output text > /dev/null 2>&1`,
        { stdio: "ignore" },
      )
      log.success("ElasticMQの起動を確認しました")
      return true
    } catch (_error) {
      if (i === maxRetries - 1) {
        log.error("ElasticMQの起動確認に失敗しました")
        return false
      }
      await sleep(2000)
    }
  }
  return false
}

/**
 * SAM Localの起動確認（ポートチェック）
 */
async function checkSamLocal(maxRetries = 30) {
  log.info("SAM Localの起動を確認中...")
  for (let i = 0; i < maxRetries; i++) {
    try {
      // ポートが開いているかだけチェック（SAM Localは起動していればOK）
      execSync(`nc -z localhost ${CONFIG.samPort}`, { stdio: "ignore" })
      log.success("SAM Localの起動を確認しました")
      return true
    } catch (_error) {
      if (i === maxRetries - 1) {
        log.error("SAM Localの起動確認に失敗しました")
        return false
      }
      await sleep(2000)
    }
  }
  return false
}

/**
 * ポートが使用されているかチェック
 */
function isPortInUse(port) {
  try {
    execSync(`lsof -i:${port}`, { stdio: "ignore" })
    return true
  } catch (_error) {
    return false
  }
}

/**
 * Dockerコンテナの停止・削除
 */
function stopContainers(clean = false) {
  log.info("既存コンテナを停止中...")
  try {
    const command = clean ? "docker compose down -v" : "docker compose down"
    execSync(command, { cwd: BACKEND_DIR, stdio: "inherit" })
  } catch (_error) {
    log.warn("Docker compose down で警告が発生しました")
  }
}

/**
 * Lambda関数のビルド
 */
function buildLambdaFunctions() {
  log.info("Lambda関数をビルド中...")
  try {
    execSync("pnpm build:lambda", { cwd: BACKEND_DIR, stdio: "inherit" })

    // ビルド結果の確認
    const distDir = path.join(BACKEND_DIR, "dist/lambda/list-datasources")
    if (!fs.existsSync(distDir)) {
      throw new Error(
        "dist/lambda/list-datasources ディレクトリが見つかりません",
      )
    }

    log.success("Lambda関数のビルドが完了しました")
  } catch (error) {
    log.error(`Lambda関数のビルドに失敗しました: ${error.message}`)
    throw error
  }
}

/**
 * Docker Composeサービスの起動
 */
async function startDockerServices() {
  log.info("Docker Composeサービスを起動中...")
  try {
    execSync("docker compose up -d", { cwd: BACKEND_DIR, stdio: "inherit" })
    log.info("Docker Composeサービスの起動を待機中...")
    await sleep(10000)
  } catch (error) {
    log.error(`Docker Composeサービスの起動に失敗しました: ${error.message}`)
    throw error
  }
}

/**
 * PostgreSQLの起動確認
 */
async function checkPostgreSQL() {
  log.info("PostgreSQLの起動を確認中...")
  for (let i = 0; i < 60; i++) {
    try {
      execSync(
        "docker compose exec -T db pg_isready -U postgres -d chase_light",
        { cwd: BACKEND_DIR, stdio: "ignore" },
      )
      log.success("PostgreSQLが起動しました")
      return true
    } catch (error) {
      if (i === 59) {
        log.error("PostgreSQLの起動がタイムアウトしました")
        try {
          execSync("docker compose logs db", {
            cwd: BACKEND_DIR,
            stdio: "inherit",
          })
        } catch (_logError) {
          // ログ取得エラーは無視
        }
        return false
      }
      await sleep(1000)
    }
  }
  return false
}

/**
 * SAM Localの起動
 */
async function startSamLocal(backgroundMode = false) {
  log.info("SAM Localを起動中...")

  // ポートが使用されているかチェック
  if (isPortInUse(CONFIG.samPort)) {
    log.warn(
      `ポート${CONFIG.samPort}が既に使用されています。既存のプロセスを停止してください。`,
    )
    try {
      execSync(`lsof -i:${CONFIG.samPort}`, { stdio: "inherit" })
    } catch (_error) {
      // 無視
    }
    throw new Error(`ポート${CONFIG.samPort}が使用中です`)
  }

  // バックグラウンドモードの場合は完全に切り離す
  const spawnOptions = backgroundMode
    ? {
        cwd: BACKEND_DIR,
        stdio: "ignore",
        detached: true,
      }
    : {
        cwd: BACKEND_DIR,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      }

  // SAM Localを起動
  const samProcess = spawn(
    "sam",
    [
      "local",
      "start-lambda",
      "--host",
      "0.0.0.0",
      "--port",
      CONFIG.samPort.toString(),
      "--template",
      "infrastructure/sam-template.yaml",
      "--env-vars",
      "infrastructure/env.json",
      "--docker-network",
      "host",
    ],
    spawnOptions,
  )

  // フォアグラウンドモードの場合のみログファイルにリダイレクト
  if (!backgroundMode) {
    const logFile = fs.createWriteStream(
      path.join(BACKEND_DIR, "sam-local.log"),
    )
    samProcess.stdout.pipe(logFile)
    samProcess.stderr.pipe(logFile)
  }

  // バックグラウンドモードの場合はプロセスを完全に独立させる
  if (backgroundMode) {
    samProcess.unref()
  }

  // PIDファイルに保存
  fs.writeFileSync(
    path.join(BACKEND_DIR, "sam-local.pid"),
    samProcess.pid.toString(),
  )

  // SAM Localの起動を待機
  log.info("SAM Localの起動を待機中...")
  const started = await checkSamLocal()

  if (!started) {
    samProcess.kill()
    throw new Error("SAM Localの起動に失敗しました")
  }

  log.success(`SAM Localが起動しました (PID: ${samProcess.pid})`)
  return samProcess
}

/**
 * JSONファイルの読み込み
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    log.error(`ファイル読み込みエラー: ${filePath} - ${error.message}`)
    throw error
  }
}

/**
 * ASLテンプレートの変数置換
 */
function replaceVariables(aslContent, variables) {
  let result = aslContent

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `\${${key}}`
    result = result.replace(
      new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      value,
    )
  }

  return result
}

/**
 * SQSキューの作成
 */
async function createSQSQueue(endpoint, queueName) {
  try {
    log.info(`SQSキューを作成中: ${queueName}`)
    const command = `aws --region ${CONFIG.awsRegion} --endpoint-url "${endpoint}" sqs create-queue --queue-name "${queueName}"`
    execSync(command, { stdio: "ignore" })
    log.success("SQSキュー作成完了")
  } catch (_error) {
    log.warn("キューは既に存在します")
  }
}

/**
 * 既存ステートマシンの削除
 */
async function deleteExistingStateMachine(endpoint, stateMachineName) {
  try {
    const listCommand = `aws stepfunctions list-state-machines --endpoint-url "${endpoint}" --query "stateMachines[?name=='${stateMachineName}'].stateMachineArn" --output text`
    const existingArn = execSync(listCommand, { encoding: "utf8" }).trim()

    if (existingArn && existingArn !== "None" && existingArn !== "") {
      log.warn(`既存のステートマシンを削除中: ${stateMachineName}`)
      const deleteCommand = `aws stepfunctions delete-state-machine --endpoint-url "${endpoint}" --state-machine-arn "${existingArn}"`
      execSync(deleteCommand, { stdio: "ignore" })
      log.success("既存のステートマシン削除完了")
    }
  } catch (_error) {
    // 既存のステートマシンが存在しない場合は無視
  }
}

/**
 * ステートマシンの作成
 */
async function createStateMachine(endpoint, name, definitionFile, roleArn) {
  try {
    log.info(`ステートマシンを作成中: ${name}`)
    const command = `aws stepfunctions create-state-machine --endpoint-url "${endpoint}" --name "${name}" --definition "file://${definitionFile}" --role-arn "${roleArn}" --query 'stateMachineArn' --output text`
    const arn = execSync(command, { encoding: "utf8" }).trim()
    log.success(`ステートマシン作成完了: ${arn}`)
    return arn
  } catch (error) {
    log.error(`ステートマシン作成失敗: ${error.message}`)
    throw error
  }
}

/**
 * StepFunctions環境のセットアップ
 */
async function setupStepFunctions() {
  log.info("StepFunctions環境をセットアップ中...")

  // 設定ファイル読み込み
  const localVariables = loadJsonFile(CONFIG.localVariables)
  const aslTemplate = fs.readFileSync(CONFIG.aslTemplate, "utf8")

  // SQSキュー作成
  await createSQSQueue(
    localVariables.ElasticMQ.ExternalEndpoint,
    "process-updates-queue",
  )

  // ASL変数置換
  log.info("ASLテンプレートの変数を置換中...")
  const processedAsl = replaceVariables(aslTemplate, localVariables.Variables)
  fs.writeFileSync(CONFIG.tempFile, processedAsl)
  log.success("変数置換完了")

  // 既存ステートマシン削除
  await deleteExistingStateMachine(
    localVariables.StepFunctionsLocal.Endpoint,
    CONFIG.stateMachineName,
  )

  // ステートマシン作成
  const stateMachineArn = await createStateMachine(
    localVariables.StepFunctionsLocal.Endpoint,
    CONFIG.stateMachineName,
    CONFIG.tempFile,
    localVariables.StepFunctionsLocal.DummyRoleArn,
  )

  // 一時ファイル削除
  fs.unlinkSync(CONFIG.tempFile)

  return { localVariables, stateMachineArn }
}

/**
 * 実行結果の表示
 */
function showExecutionExamples(localVariables, stateMachineArn) {
  log.info("=== セットアップ完了 ===")
  console.log("")
  console.log("サービス一覧:")
  console.log(`  - PostgreSQL: localhost:${CONFIG.dbPort}`)
  console.log(
    `  - StepFunctions Local: ${localVariables.StepFunctionsLocal.Endpoint}`,
  )
  console.log(`  - SAM Local: http://localhost:${CONFIG.samPort}`)
  console.log(`  - ElasticMQ Web UI: http://localhost:9325`)
  console.log("")
  console.log(`ステートマシンARN: ${stateMachineArn}`)
  console.log("")
  console.log("StepFunctions実行例:")
  console.log(`  aws stepfunctions start-execution \\`)
  console.log(
    `    --endpoint-url ${localVariables.StepFunctionsLocal.Endpoint} \\`,
  )
  console.log(`    --state-machine-arn '${stateMachineArn}' \\`)
  console.log(`    --input '{"sourceType": "github"}'`)
  console.log("")
  console.log("キューメッセージ確認:")
  console.log(
    `  aws --region ${CONFIG.awsRegion} --endpoint-url ${localVariables.ElasticMQ.ExternalEndpoint} \\`,
  )
  console.log(`    sqs receive-message \\`)
  console.log(
    `    --queue-url ${localVariables.ElasticMQ.ExternalEndpoint}/000000000000/process-updates-queue`,
  )
  console.log("")
  console.log("停止する場合は以下を実行してください:")
  console.log("  pnpm local:stop")
  console.log("")
  console.log("フォアグラウンドで実行する場合は:")
  console.log("  pnpm local:start --wait")
}

/**
 * クリーンアップ処理
 */
function setupCleanup(samProcess, enableSignalHandling = true) {
  const cleanup = () => {
    log.info("開発環境を停止中...")

    // SAM Localプロセス停止
    if (samProcess && !samProcess.killed) {
      samProcess.kill()
    }

    // Docker Compose停止
    try {
      execSync("docker compose down", { cwd: BACKEND_DIR, stdio: "inherit" })
    } catch (_error) {
      log.warn("Docker compose停止で警告が発生しました")
    }

    // ファイルクリーンアップ
    try {
      fs.unlinkSync(path.join(BACKEND_DIR, "sam-local.pid"))
      fs.unlinkSync(path.join(BACKEND_DIR, "sam-local.log"))
    } catch (_error) {
      // ファイルが存在しない場合は無視
    }

    log.success("開発環境を停止しました")
    process.exit(0)
  }

  // フォアグラウンド実行時のみシグナルハンドリングを設定
  if (enableSignalHandling) {
    process.on("SIGINT", cleanup)
    process.on("SIGTERM", cleanup)
  }

  return cleanup
}

/**
 * ユーティリティ関数
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArguments()

  if (options.help) {
    showHelp()
    return
  }

  try {
    log.info("Chase Light StepFunctions Local統合環境をセットアップします")
    log.info(`Backend Directory: ${BACKEND_DIR}`)

    // 1. 既存コンテナの停止・削除
    stopContainers(options.clean)

    // 2. Lambda関数のビルド
    buildLambdaFunctions()

    // 3. Docker Composeサービスの起動
    await startDockerServices()

    // 4. PostgreSQLの起動確認
    const pgStarted = await checkPostgreSQL()
    if (!pgStarted) {
      throw new Error("PostgreSQLの起動に失敗しました")
    }

    // 5. StepFunctions LocalとElasticMQの起動確認
    const stepFunctionsStarted = await checkStepFunctionsLocal()
    const elasticMqStarted = await checkElasticMQ()

    if (!stepFunctionsStarted || !elasticMqStarted) {
      throw new Error("StepFunctions LocalまたはElasticMQの起動に失敗しました")
    }

    // 6. SAM Localの起動
    const samProcess = await startSamLocal(!options.wait)

    // 7. StepFunctions環境のセットアップ
    const { localVariables, stateMachineArn } = await setupStepFunctions()

    // 8. 実行結果の表示
    showExecutionExamples(localVariables, stateMachineArn)

    // 9. 待機モードの処理
    if (options.wait) {
      // フォアグラウンド実行時のみクリーンアップ処理を設定
      const cleanup = setupCleanup(samProcess, true)

      log.info("開発環境が起動しています。Ctrl+Cで停止してください。")
      // SAM Localプロセスの終了を待機
      samProcess.on("exit", (code) => {
        log.warn(`SAM Localが予期せず終了しました (code: ${code})`)
        cleanup()
      })

      // 無限待機
      await new Promise(() => {})
    } else {
      // バックグラウンド実行時はシグナルハンドリングを設定せずに終了
      log.success("開発環境がバックグラウンドで起動しました")
      log.info("停止する場合は以下を実行してください:")
      log.info("  pnpm local:stop")
    }
  } catch (error) {
    log.error(`セットアップ失敗: ${error.message}`)
    process.exit(1)
  }
}

// スクリプト実行
main().catch((error) => {
  log.error(`予期しないエラー: ${error.message}`)
  process.exit(1)
})
