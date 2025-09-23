import { OpenAPIHono } from "@hono/zod-openapi"
import type { GetProfileUseCase } from "../../../application/use-cases/get-profile.use-case"
import type { UpdateProfileUseCase } from "../../../application/use-cases/update-profile.use-case"
import type { GetSettingsUseCase } from "../../../application/use-cases/get-settings.use-case"
import type { UpdateSettingsUseCase } from "../../../application/use-cases/update-settings.use-case"
import { createProfileRoutes } from "./profile"
import { createSettingsRoutes } from "./settings"

export interface UserRoutesDependencies {
  getProfileUseCase: GetProfileUseCase
  updateProfileUseCase: UpdateProfileUseCase
  getSettingsUseCase: GetSettingsUseCase
  updateSettingsUseCase: UpdateSettingsUseCase
}

export const createUserRoutes = ({
  getProfileUseCase,
  updateProfileUseCase,
  getSettingsUseCase,
  updateSettingsUseCase,
}: UserRoutesDependencies) => {
  const app = new OpenAPIHono()

  createProfileRoutes(app, getProfileUseCase, updateProfileUseCase)
  createSettingsRoutes(
    app,
    getProfileUseCase,
    getSettingsUseCase,
    updateSettingsUseCase,
  )

  return app
}
