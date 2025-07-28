#!/usr/bin/env node

/**
 * StepFunctions Local環境セットアップスクリプト
 * 本番用ASLテンプレートの変数をローカル環境用に動的に置換
 */

import fs from "fs"
import { execSync } from "child_process"

// 色付きログ関数
const colors = {
  info: "\x1b[34m[INFO]\x1b[0m",
  success: "\x1b[32m[SUCCESS]\x1b[0m",
  error: "\x1b[31m[ERROR]\x1b[0m",
  warn: "\x1b[33m[WARN]\x1b[0m",
}

const log = {
  info: (msg) => console.log(`${colors.info} ${msg}`),
  success: (msg) => console.log(`${colors.success} ${msg}`),
  error: (msg) => console.log(`${colors.error} ${msg}`),
  warn: (msg) => console.log(`${colors.warn} ${msg}`),
}

// 設定
const CONFIG = {
  aslTemplate: "infrastructure/repository-monitoring.asl.json",
  localVariables: "infrastructure/local-variables.json",
  tempFile: "infrastructure/.repository-monitoring-local.tmp.json",
  stateMachineName: "repository-monitoring-local",
  awsRegion: "us-east-1",
}

// 環境変数設定
process.env.AWS_ACCESS_KEY_ID = "test"
process.env.AWS_SECRET_ACCESS_KEY = "test"
process.env.AWS_REGION = CONFIG.awsRegion

async function checkService(url, serviceName) {
  try {
    execSync(`curl -s "${url}" > /dev/null 2>&1`, { stdio: "ignore" })
    log.success(`${serviceName}接続確認完了`)
    return true
  } catch (_error) {
    log.error(
      `${serviceName}が起動していません。'docker compose up -d' を実行してください。`,
    )
    return false
  }
}

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    log.error(`ファイル読み込みエラー: ${filePath}`)
    throw error
  }
}

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

async function createSQSQueue(endpoint, queueName) {
  try {
    const command = `aws --region ap-northeast-1 --endpoint-url "${endpoint}" sqs create-queue --queue-name "${queueName}"`
    execSync(command, { stdio: "ignore" })
    log.success("SQSキュー作成完了")
  } catch (_error) {
    log.warn("キューは既に存在します")
  }
}

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
    // 無視（存在しない場合）
  }
}

async function createStateMachine(endpoint, name, definitionFile, roleArn) {
  try {
    const command = `aws stepfunctions create-state-machine --endpoint-url "${endpoint}" --name "${name}" --definition "file://${definitionFile}" --role-arn "${roleArn}" --query 'stateMachineArn' --output text`
    const arn = execSync(command, { encoding: "utf8" }).trim()
    log.success(`ステートマシン作成完了: ${arn}`)
    return arn
  } catch (error) {
    log.error("ステートマシン作成失敗")
    throw error
  }
}

async function main() {
  try {
    log.info("StepFunctions Local環境をセットアップしています...")

    // 1. サービス起動確認
    log.info("サービスの起動確認中...")
    const elasticMqOk = await checkService("http://localhost:9324", "ElasticMQ")
    const stepFunctionsOk = await checkService(
      "http://localhost:8083",
      "StepFunctions Local",
    )

    if (!elasticMqOk || !stepFunctionsOk) {
      process.exit(1)
    }

    // 2. 設定ファイル読み込み
    log.info("設定ファイルを読み込み中...")
    const localVariables = loadJsonFile(CONFIG.localVariables)
    const aslTemplate = fs.readFileSync(CONFIG.aslTemplate, "utf8")

    // 3. SQSキュー作成
    log.info("SQSキューを作成中...")
    await createSQSQueue(
      localVariables.ElasticMQ.ExternalEndpoint,
      "process-updates-queue",
    )

    // 4. ASL変数置換
    log.info("ASLテンプレートの変数を置換中...")
    const processedAsl = replaceVariables(aslTemplate, localVariables.Variables)
    fs.writeFileSync(CONFIG.tempFile, processedAsl)
    log.success("変数置換完了")

    // 5. 既存ステートマシン削除
    log.info("既存のステートマシンをチェック中...")
    await deleteExistingStateMachine(
      localVariables.StepFunctionsLocal.Endpoint,
      CONFIG.stateMachineName,
    )

    // 6. ステートマシン作成
    log.info("ステートマシンを作成中...")
    const stateMachineArn = await createStateMachine(
      localVariables.StepFunctionsLocal.Endpoint,
      CONFIG.stateMachineName,
      CONFIG.tempFile,
      localVariables.StepFunctionsLocal.DummyRoleArn,
    )

    // 7. 一時ファイル削除
    fs.unlinkSync(CONFIG.tempFile)

    // 8. 実行例表示
    log.info("=== セットアップ完了 ===")
    console.log("")
    console.log(`ステートマシンARN: ${stateMachineArn}`)
    console.log("")
    console.log("実行例:")
    console.log(`  aws stepfunctions start-execution \\`)
    console.log(
      `    --endpoint-url ${localVariables.StepFunctionsLocal.Endpoint} \\`,
    )
    console.log(`    --state-machine-arn '${stateMachineArn}' \\`)
    console.log(`    --input '{"sourceType": "github_repository"}'`)
    console.log("")
    console.log("キューメッセージ確認:")
    console.log(
      `  aws --region ap-northeast-1 --endpoint-url ${localVariables.ElasticMQ.ExternalEndpoint} \\`,
    )
    console.log(`    sqs receive-message \\`)
    console.log(
      `    --queue-url ${localVariables.ElasticMQ.ExternalEndpoint}/000000000000/process-updates-queue`,
    )
    console.log("")
    console.log("ElasticMQ Web UI: http://localhost:9325")
  } catch (error) {
    log.error(`セットアップ失敗: ${error.message}`)
    process.exit(1)
  }
}

main()
