import {
  createUserViaProviderSchema,
  userSchema,
} from "@/features/user/domain/user"
import { getTokenValidatorInstance } from "@/features/auth/services/token-validator"
import { ActionDefinition } from "@/lib/hono/action-definition"
import { type AppContext } from "@/app/chase-light-app"
import { ROUTES } from "@/app/route-consts"
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi"
import { v7 as uuidv7 } from "uuid"
import { ToDbDateTimeStrict } from "@/lib/utils/date-utils"
import { TokenError } from "@/features/auth/services/token-validator-interface"
import { getPrismaClientInstance } from "@/lib/prisma/app-prisma-client"

export class SignupVieProviderAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ["users"],
      method: "post",
      path: ROUTES.USERS.SIGNUP_VIA_PROVIDER.DEFINITION,
      request: {
        body: {
          content: {
            "application/json": {
              schema: createUserViaProviderSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "",
          content: {
            "application/json": {
              schema: userSchema,
            },
          },
        },
        400: {
          description: "",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: "",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    })

    parentApp.openapi(route, async (c) => {
      const json = c.req.valid("json")
      const accessToken = json.accessToken
      const idToken = json.idToken

      const tokenValidator = getTokenValidatorInstance()

      try {
        await tokenValidator.parseAccessToken(accessToken)
        const payload = await tokenValidator.parseIdToken(idToken)

        const userId = uuidv7()

        // TODO: nicknameが既存アカウントと重複する場合は登録不可

        const prisma = getPrismaClientInstance()
        const createdUser = await prisma.user.create({
          data: {
            id: userId,
            providerId: payload.sub || "",
            accountName: payload.nickname || "",
            displayName: payload.name || "",
            email: payload.email || "",
            emailVerified: payload.email_verified || false,
            createdAt: ToDbDateTimeStrict(new Date()),
            updatedAt: ToDbDateTimeStrict(new Date()),
          },
        })

        return c.json(createdUser, 200)
      } catch (error) {
        console.error(error)
        if (error instanceof TokenError) {
          return c.json({ error: error.message }, 400)
        }
        return c.json({ error: "Unknown error" }, 500)
      }
    })
  }
}
