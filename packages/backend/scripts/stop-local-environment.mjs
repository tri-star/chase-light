#!/usr/bin/env node

/**
 * Chase Light StepFunctions Local統合環境停止スクリプト
 *
 * 機能:
 * - SAM Localプロセスの停止
 * - Docker Composeサービスの停止
 * - ログファイルとPIDファイルのクリーンアップ
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"
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

/**
 * プロセスが生きているかチェック
 */
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return false
  }
}

/**
 * SAM Localプロセスの停止
 */
function stopSamLocal() {
  const pidFile = path.join(BACKEND_DIR, "sam-local.pid")

  if (fs.existsSync(pidFile)) {
    try {
      const pidContent = fs.readFileSync(pidFile, "utf8").trim()
      const pid = parseInt(pidContent, 10)

      if (isProcessAlive(pid)) {
        log.info(`SAM Localを停止中... (PID: ${pid})`)

        // 通常の終了シグナル
        process.kill(pid, "SIGTERM")

        // 少し待ってからプロセスが終了したかチェック
        setTimeout(() => {
          if (isProcessAlive(pid)) {
            log.warn("SAM Localを強制終了中...")
            try {
              process.kill(pid, "SIGKILL")
            } catch (error) {
              log.warn(`強制終了に失敗しました: ${error.message}`)
            }
          }
        }, 2000)

        log.success("SAM Local停止完了")
      } else {
        log.info("SAM Localプロセスは既に停止しています")
      }
    } catch (error) {
      log.error(`SAM Local停止エラー: ${error.message}`)
    }

    // PIDファイル削除
    try {
      fs.unlinkSync(pidFile)
    } catch (error) {
      log.warn(`PIDファイル削除に失敗: ${error.message}`)
    }
  } else {
    // PIDファイルがない場合は、ポートを使用しているプロセスを探して終了
    log.info(
      "PIDファイルが見つかりません。ポート3001を使用しているプロセスをチェック中...",
    )
    try {
      const result = execSync("lsof -ti:3001", { encoding: "utf8" }).trim()
      if (result) {
        log.info("ポート3001を使用しているプロセスを停止中...")
        execSync("lsof -ti:3001 | xargs kill", { stdio: "ignore" })
        log.success("ポート3001のプロセス停止完了")
      } else {
        log.info("ポート3001を使用しているプロセスは見つかりませんでした")
      }
    } catch (error) {
      log.info("ポート3001を使用しているプロセスは見つかりませんでした")
    }
  }
}

/**
 * Docker Composeサービスの停止
 */
function stopDockerServices() {
  log.info("Docker Composeサービスを停止中...")
  try {
    execSync("docker compose down", { cwd: BACKEND_DIR, stdio: "inherit" })
    log.success("Docker Composeサービス停止完了")
  } catch (error) {
    log.warn(`Docker Compose停止で警告が発生しました: ${error.message}`)
  }
}

/**
 * ログファイルとテンポラリファイルのクリーンアップ
 */
function cleanupFiles() {
  log.info("ファイルをクリーンアップ中...")

  const filesToCleanup = [
    path.join(BACKEND_DIR, "sam-local.log"),
    path.join(
      BACKEND_DIR,
      "infrastructure/.data-source-update-detection-local.tmp.json",
    ),
  ]

  let cleanedFiles = 0

  for (const file of filesToCleanup) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
        cleanedFiles++
      }
    } catch (error) {
      log.warn(`ファイル削除に失敗: ${file} - ${error.message}`)
    }
  }

  if (cleanedFiles > 0) {
    log.success(`${cleanedFiles}個のファイルをクリーンアップしました`)
  } else {
    log.info("クリーンアップするファイルはありませんでした")
  }
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log("Usage: node stop-local-environment.mjs [OPTIONS]")
  console.log("")
  console.log("Chase Light StepFunctions Local統合開発環境を停止します。")
  console.log("")
  console.log("OPTIONS:")
  console.log("  --help, -h     このヘルプメッセージを表示")
  console.log("")
  console.log("EXAMPLES:")
  console.log("  node stop-local-environment.mjs")
  console.log("  pnpm local:stop")
}

/**
 * コマンドライン引数の解析
 */
function parseArguments() {
  const args = process.argv.slice(2)

  for (const arg of args) {
    switch (arg) {
      case "--help":
      case "-h":
        return { help: true }
      default:
        log.warn(`未知のオプション: ${arg}`)
    }
  }

  return { help: false }
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
    log.info("Chase Light開発環境を停止しています...")

    // 1. SAM Localプロセスの停止
    stopSamLocal()

    // 2. Docker Composeサービスの停止
    stopDockerServices()

    // 3. ファイルのクリーンアップ
    cleanupFiles()

    log.success("開発環境の停止が完了しました")
  } catch (error) {
    log.error(`停止処理でエラーが発生しました: ${error.message}`)
    process.exit(1)
  }
}

// スクリプト実行
main().catch((error) => {
  log.error(`予期しないエラー: ${error.message}`)
  process.exit(1)
})
