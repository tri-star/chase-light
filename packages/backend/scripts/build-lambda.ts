#!/usr/bin/env tsx

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { buildLambdaConfig, type LambdaConfig } from "./lambda-config.js"
import {
  loadLockfile,
  resolveDependencyVersions,
  selectImporter,
} from "./lib/pnpm/lockfile.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, "..", ".env") })
const {
  lambdaConfigs,
  lambdaDefaults,
  defaultEsbuildConfig,
  defaultPackageJsonConfig,
} = buildLambdaConfig()

const DIST_DIR = path.join(__dirname, "..", "dist", "lambda")

const log = (message: string) => console.log(message)

const ensureDistDir = () => {
  log("🧹 Cleaning lambda distribution directory...")
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(DIST_DIR, { recursive: true })
}

const computeExternalPackages = (config: LambdaConfig) => {
  const base = config.skipDefaultExternalPackages
    ? []
    : lambdaDefaults.defaultExternalPackages
  return Array.from(
    new Set([...base, ...(config.externalPackages ?? [])].filter(Boolean)),
  )
}

const computeDependencies = (
  importer: string,
  config: LambdaConfig,
  lockfile = loadLockfile(__dirname),
) => {
  const baseDeps = config.skipDefaultDependencies
    ? []
    : lambdaDefaults.defaultDependencies
  const overrides = config.dependencyOverrides ?? {}
  const requested = [
    ...baseDeps,
    ...(config.additionalDependencies ?? []),
    ...Object.keys(overrides),
  ]

  if (requested.length === 0) {
    return {}
  }

  const resolved = resolveDependencyVersions({
    lockfile,
    importer,
    dependencyNames: requested,
    overrides,
  })

  return resolved
}

const buildEsbuildCommand = (
  functionName: string,
  entryPoint: string,
  externalPackages: string[],
) => {
  const outputPath = path.join(DIST_DIR, functionName, "index.js")
  const externalArgs = externalPackages
    .map((pkg) => `--external:${pkg}`)
    .join(" ")
  const sourcemapArg = defaultEsbuildConfig.sourcemap
    ? `--sourcemap=${defaultEsbuildConfig.sourcemap}`
    : ""

  return [
    "pnpm",
    "esbuild",
    entryPoint,
    `--bundle`,
    `--outfile=${outputPath}`,
    `--platform=${defaultEsbuildConfig.platform}`,
    `--target=${defaultEsbuildConfig.target}`,
    `--format=${defaultEsbuildConfig.format}`,
    sourcemapArg,
    `--minify=${defaultEsbuildConfig.minify}`,
    externalArgs,
  ]
    .filter(Boolean)
    .join(" ")
}

const writePackageJson = (
  functionName: string,
  config: LambdaConfig,
  dependencies: Record<string, string>,
) => {
  log(`📄 Generating package.json for ${functionName}...`)

  const functionDir = path.join(DIST_DIR, functionName)
  const packageJson = {
    name: config.name,
    ...defaultPackageJsonConfig,
    main: "index.js",
    description: config.description,
    dependencies,
  }

  const packageJsonPath = path.join(functionDir, "package.json")
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

const installDependencies = (functionName: string) => {
  log(`📥 Installing dependencies for ${functionName}...`)
  const functionDir = path.join(DIST_DIR, functionName)

  execSync("npm install --omit=dev", {
    cwd: functionDir,
    stdio: "inherit",
  })
}

const buildLambdaFunction = (
  functionName: string,
  config: LambdaConfig,
  options: {
    lockfileImporter: string
    lockfile: ReturnType<typeof loadLockfile>
  },
) => {
  log(`📦 Building Lambda function: ${functionName}...`)

  const functionDir = path.join(DIST_DIR, functionName)
  fs.mkdirSync(functionDir, { recursive: true })

  const externalPackages = computeExternalPackages(config)
  const esbuildCommand = buildEsbuildCommand(
    functionName,
    config.entryPoint,
    externalPackages,
  )

  log(`Running: ${esbuildCommand}`)
  execSync(esbuildCommand, { stdio: "inherit" })

  const dependencies = computeDependencies(
    options.lockfileImporter,
    config,
    options.lockfile,
  )
  writePackageJson(functionName, config, dependencies)
  installDependencies(functionName)

  log(`✅ Built ${functionName}\n`)
}

const buildAllFunctions = (
  lockfileImporter: string,
  lockfile: ReturnType<typeof loadLockfile>,
) => {
  ensureDistDir()

  for (const [functionName, config] of Object.entries(lambdaConfigs)) {
    buildLambdaFunction(functionName, config, { lockfileImporter, lockfile })
  }

  log("🚀 All Lambda functions built successfully!")
}

const buildSpecificFunction = (
  target: string,
  lockfileImporter: string,
  lockfile: ReturnType<typeof loadLockfile>,
) => {
  const config = lambdaConfigs[target]
  if (!config) {
    const available = Object.keys(lambdaConfigs).join(", ")
    throw new Error(
      `Unknown Lambda function: ${target}\nAvailable: ${available}`,
    )
  }

  ensureDistDir()
  buildLambdaFunction(target, config, { lockfileImporter, lockfile })
}

const main = () => {
  const args = process.argv.slice(2)
  const lockfile = loadLockfile(__dirname)
  const importer = selectImporter(lockfile, __dirname, lambdaDefaults.importer)

  if (args.length === 0) {
    buildAllFunctions(importer, lockfile)
    return
  }

  if (args.length === 1) {
    buildSpecificFunction(args[0], importer, lockfile)
    return
  }

  throw new Error("Usage: pnpm --filter backend build:lambda [function-name]")
}

main()
