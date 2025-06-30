import { eq, and, or, desc, asc } from "drizzle-orm"
import { PgTable } from "drizzle-orm/pg-core"
import { db } from "../../../db/connection.js"
import { randomUUID } from "node:crypto"

export interface BaseRepository<T> {
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>
  findById(id: string): Promise<T | null>
  findMany(
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T[]>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
}

export abstract class DrizzleBaseRepository<T> implements BaseRepository<T> {
  constructor(protected table: PgTable) {}

  abstract create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract findMany(
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T[]>
  abstract update(id: string, data: Partial<T>): Promise<T | null>
  abstract delete(id: string): Promise<boolean>

  protected generateId(): string {
    // Generate UUIDv7 for time-ordered UUIDs
    // For simplicity, using crypto.randomUUID() - in production, consider UUIDv7
    return randomUUID()
  }
}

export { eq, and, or, desc, asc, db }
