import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"
import process from "node:process"

// 環境に応じて適切な.envファイルを選択
const envFile = process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
config({ path: envFile })

console.log(`🔧 Drizzle config loading: ${envFile}`)

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: String(process.env.DB_PASSWORD || ""),
    database: process.env.DB_NAME || "chase_light",
    ssl: process.env.DB_SSL === "true",
  },
  verbose: true,
  strict: true,
})
