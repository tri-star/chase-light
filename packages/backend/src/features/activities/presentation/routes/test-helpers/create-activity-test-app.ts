import { OpenAPIHono } from "@hono/zod-openapi"
import { globalJWTAuth } from "../../../../identity/middleware/exclusive-jwt-auth.middleware"
import { createActivityPresentationRoutes } from "../../routes"
import {
  buildActivityDeps,
  type ActivityUseCases,
  type ActivityAdapters,
  type ActivityDeps,
} from "../../../application"

/**
 * Activity テストアプリ作成のオプション
 */
export type CreateActivityTestAppOptions = {
  /** UseCase のオーバーライド */
  useCaseOverrides?: Partial<ActivityUseCases>
  /** アダプタのオーバーライド */
  adapterOverrides?: Partial<ActivityAdapters>
}

/**
 * Activity フィーチャーのテスト用Honoアプリを作成する
 *
 * JWT認証ミドルウェアが適用済みのアプリを返す。
 * 必要に応じてUseCaseやアダプタをオーバーライドできる。
 *
 * @param options - テストアプリ作成オプション
 * @returns テスト用のHonoアプリと依存関係
 */
export function createActivityTestApp(options?: CreateActivityTestAppOptions): {
  app: OpenAPIHono
  deps: ActivityDeps
} {
  const app = new OpenAPIHono()
  app.use("*", globalJWTAuth)

  const deps = buildActivityDeps({
    adapters: options?.adapterOverrides,
    useCases: options?.useCaseOverrides,
  })

  const presentationRoutes = createActivityPresentationRoutes(deps)
  app.route("/", presentationRoutes)

  return { app, deps }
}
