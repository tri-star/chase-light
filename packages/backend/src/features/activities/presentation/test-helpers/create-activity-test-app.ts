import { OpenAPIHono } from "@hono/zod-openapi"
import { globalJWTAuth } from "../../../identity"
import type { ActivityDeps } from "../../application/activity-deps"
import { buildActivityDeps } from "../../application/activity-deps"
import { createActivityPresentationRoutes } from "../routes"

/**
 * createActivityTestApp関数のオプション
 */
export interface CreateActivityTestAppOptions {
  useCaseOverrides?: Partial<ActivityDeps>
}

/**
 * Activityテスト用のHonoアプリケーションを作成する
 *
 * @param options - オプション設定。useCaseOverridesで特定のUseCaseを差し替え可能
 * @returns 設定済みのOpenAPIHonoアプリケーション
 *
 * @example
 * ```ts
 * // デフォルトの依存関係を使用
 * const app = createActivityTestApp()
 *
 * // 特定のUseCaseをモックに差し替え
 * const mockUseCase = { execute: vi.fn() }
 * const app = createActivityTestApp({
 *   useCaseOverrides: { listUserActivitiesUseCase: mockUseCase }
 * })
 * ```
 */
export function createActivityTestApp(
  options?: CreateActivityTestAppOptions,
): OpenAPIHono {
  const deps = buildActivityDeps({
    useCaseOverrides: options?.useCaseOverrides,
  })

  const app = new OpenAPIHono()
  app.use("*", globalJWTAuth)
  app.route("/", createActivityPresentationRoutes(deps))

  return app
}
