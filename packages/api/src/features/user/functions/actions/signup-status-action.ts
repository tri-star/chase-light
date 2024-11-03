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

export class SignupStatusAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ["users"],
      method: "post",
      path: ROUTES.USERS.SIGNUP_STATUS.DEFINITION,
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
              schema: z.object({
                status: z.string(),
              }),
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

        const prisma = getPrismaClientInstance()

        const existingUser = await prisma.user.findFirst({
          where: {
            providerId: payload.sub,
          },
        })
        let status = "not-exist"
        if (existingUser) {
          status = "exist"
        }

        // TODO: accountNameが重複する場合、登録できない旨を返す

        return c.json({ status }, 200)
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
