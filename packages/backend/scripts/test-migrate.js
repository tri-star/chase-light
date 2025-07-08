#!/usr/bin/env node

/**
 * テスト用データベースマイグレーションスクリプト
 * NODE_ENV=testを設定してdrizzle migrateを実行
 * drizzle.config.tsが自動的に.env.testingを選択します
 */

import { spawn } from "node:child_process"
import { config } from "dotenv"
// 環境に応じて適切な.envファイルを選択
config({ path: '.env.testing' })

console.log(`🔧 Drizzle config loading: .env.testing`)

console.log("🧪 Running test database migration...")

// NODE_ENV=test を設定してdrizzle-kit migrateを実行
const migrate = spawn("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "test", // これだけでdrizzle.config.tsが.env.testingを選択
  },
})

migrate.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Test database migration completed successfully")
  } else {
    console.error("❌ Test database migration failed")
    process.exit(code)
  }
})

migrate.on("error", (error) => {
  console.error("❌ Failed to start migration process:", error)
  process.exit(1)
})
