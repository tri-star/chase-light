import { drizzle } from "drizzle-orm/node-postgres"
import { Client } from "pg"
import * as schema from "./schema.js"
import process from "node:process"
import console from "node:console"
import { config } from "dotenv"

// Load environment variables
config()

// Database connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  database: process.env.DB_NAME || "chase_light",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
}

console.log("🔧 Database connection config:", {
  ...connectionConfig,
  password: connectionConfig.password ? "[REDACTED]" : "[EMPTY]",
})

// Create PostgreSQL client
const client = new Client(connectionConfig)

// Initialize Drizzle with the client and schema
export const db = drizzle(client, { schema })

// Connection management
let isConnected = false

export async function connectDb(): Promise<void> {
  if (!isConnected) {
    await client.connect()
    isConnected = true
    console.log("Database connected successfully")
  }
}

export async function disconnectDb(): Promise<void> {
  if (isConnected) {
    await client.end()
    isConnected = false
    console.log("Database disconnected")
  }
}

// Health check function
export async function checkDbHealth(): Promise<boolean> {
  try {
    await client.query("SELECT 1")
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

// Export schema for external use
export { schema }
