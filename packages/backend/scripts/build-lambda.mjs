#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { fileURLToPath } from "url"
import {
  lambdaConfigs,
  defaultEsbuildConfig,
  defaultPackageJsonConfig,
} from "./lambda-config.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, "..", "dist", "lambda")

/**
 * ディストリビューションディレクトリをクリーンアップ
 */
function cleanDistDir() {
  console.log("🧹 Cleaning lambda distribution directory...")
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(DIST_DIR, { recursive: true })
}

/**
 * esbuildコマンドを構築
 */
function buildEsbuildCommand(functionName, config) {
  const outputPath = path.join(DIST_DIR, functionName, "index.js")
  const externalArgs = config.externalPackages
    .map((pkg) => `--external:${pkg}`)
    .join(" ")

  return `pnpm esbuild --bundle --outfile=${outputPath} --platform=${defaultEsbuildConfig.platform} --target=${defaultEsbuildConfig.target} --format=${defaultEsbuildConfig.format} ${externalArgs} ${config.entryPoint}`
}

/**
 * 単一のLambda関数をビルド
 */
function buildLambdaFunction(functionName, config) {
  console.log(`📦 Building Lambda function: ${functionName}...`)

  // ディレクトリ作成
  const functionDir = path.join(DIST_DIR, functionName)
  fs.mkdirSync(functionDir, { recursive: true })

  // esbuildでバンドル
  const esbuildCommand = buildEsbuildCommand(functionName, config)
  console.log(`Running: ${esbuildCommand}`)
  execSync(esbuildCommand, { stdio: "inherit" })

  console.log(`✅ Built ${functionName}`)
}

/**
 * Lambda関数用のpackage.jsonを生成
 */
function generatePackageJson(functionName, config) {
  console.log(`📄 Generating package.json for ${functionName}...`)

  const functionDir = path.join(DIST_DIR, functionName)
  const packageJson = {
    name: config.name,
    ...defaultPackageJsonConfig,
    main: "index.js",
    description: config.description,
    dependencies: config.dependencies,
  }

  const packageJsonPath = path.join(functionDir, "package.json")
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  console.log(`✅ Generated package.json for ${functionName}`)
}

/**
 * Lambda関数の依存関係をインストール
 */
function installDependencies(functionName) {
  console.log(`📥 Installing dependencies for ${functionName}...`)

  const functionDir = path.join(DIST_DIR, functionName)
  execSync("npm install --omit=dev", {
    cwd: functionDir,
    stdio: "inherit",
  })

  console.log(`✅ Installed dependencies for ${functionName}`)
}

/**
 * すべてのLambda関数をビルド
 */
function buildAllFunctions() {
  cleanDistDir()

  for (const [functionName, config] of Object.entries(lambdaConfigs)) {
    try {
      buildLambdaFunction(functionName, config)
      generatePackageJson(functionName, config)
      installDependencies(functionName)
      console.log(`🎉 Successfully built ${functionName}\n`)
    } catch (error) {
      console.error(`❌ Failed to build ${functionName}:`, error.message)
      process.exit(1)
    }
  }

  console.log("🚀 All Lambda functions built successfully!")
}

/**
 * 特定のLambda関数をビルド
 */
function buildSpecificFunction(functionName) {
  if (!lambdaConfigs[functionName]) {
    console.error(`❌ Unknown Lambda function: ${functionName}`)
    console.log("Available functions:", Object.keys(lambdaConfigs).join(", "))
    process.exit(1)
  }

  cleanDistDir()

  const config = lambdaConfigs[functionName]
  try {
    buildLambdaFunction(functionName, config)
    generatePackageJson(functionName, config)
    installDependencies(functionName)
    console.log(`🎉 Successfully built ${functionName}`)
  } catch (error) {
    console.error(`❌ Failed to build ${functionName}:`, error.message)
    process.exit(1)
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2)
if (args.length === 0) {
  buildAllFunctions()
} else if (args.length === 1) {
  buildSpecificFunction(args[0])
} else {
  console.error("Usage: node build-lambda.mjs [function-name]")
  process.exit(1)
}
