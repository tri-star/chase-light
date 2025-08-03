import { defineConfig } from "drizzle-kit"
import process from "node:process"

// SSL設定の判定
const getSSLConfig = () => {
  if (process.env.DB_SSL !== "true") {
    return false
  }

  // Supabaseの場合は、証明書の検証を無効化
  if (process.env.DB_HOST?.includes("supabase.com")) {
    return {
      rejectUnauthorized: false,
    }
  }

  return true
}

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
    ssl: getSSLConfig(),
  },
  verbose: true,
  strict: true,
})
