/**
 * Brand型のヘルパー型定義
 *
 * TypeScriptでのNominal Typingを実現するためのヘルパー型
 */

/**
 * Brand型
 *
 * 基底型にブランドタグを付与して、型安全性を向上させる
 *
 * @example
 * type UserId = Brand<string, "UserId">
 * type ActivityId = Brand<string, "ActivityId">
 */
export type Brand<T, BrandTag> = T & { readonly __brand: BrandTag }
