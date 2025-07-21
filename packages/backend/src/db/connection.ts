import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema.js"
import process from "node:process"
import console from "node:console"
import { setTimeout } from "node:timers"
import { config } from "dotenv"
import { getDatabaseConfig } from "../shared/config/database.js"

// Load environment variables
config()

// Client and Drizzle instance placeholders
let pool: Pool
export let db: NodePgDatabase<typeof schema>

// Connection management
let isConnected = false

export async function connectDb(): Promise<void> {
  if (!isConnected) {
    const dbConfig = await getDatabaseConfig()

    console.log("🔧 Database connection config:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.name,
      password: dbConfig.password ? "[REDACTED]" : "[EMPTY]",
    })

    pool = new Pool({
      host: dbConfig.host,
      port: Number(dbConfig.port),
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name,
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    })

    // コネクションプールが正常に作成されたことを確認
    // pool.connect()で明示的にクライアントを取得して接続をテストしますが、
    // 取得したクライアントはすぐに解放します
    const client = await pool.connect()
    client.release()

    db = drizzle(pool, { schema })
    isConnected = true
    console.log("Database connected successfully")
  }
}

export async function disconnectDb(): Promise<void> {
  if (isConnected) {
    console.log("Starting database disconnection...")
    try {
      // タイムアウトを設定して強制的に終了
      const disconnectPromise = pool.end()
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(
          () => reject(new Error("Database disconnection timeout")),
          5000,
        )
      })

      await Promise.race([disconnectPromise, timeoutPromise])
      isConnected = false
      console.log("Database disconnected")
    } catch (error) {
      console.error("Error during database disconnection:", error)
      throw error
    }
  } else {
    console.log("Database was not connected, skipping disconnection")
  }
}

// Health check function
export async function checkDbHealth(): Promise<boolean> {
  try {
    await pool.query("SELECT 1")
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

// Export schema for external use
export { schema }
