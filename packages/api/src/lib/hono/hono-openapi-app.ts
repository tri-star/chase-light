import { OpenAPIHono } from "@hono/zod-openapi"
import type { Env } from "hono"
import type { ActionDefinition } from "@/lib/hono/action-definition"
import type { Serverless, HttpCors } from "serverless/aws"

export class HonoOpenApiApp<T extends Env> {
  protected app: OpenAPIHono<T>

  private corsSetting: HttpCors | undefined

  private actions: ActionDefinition<T>[] = []

  private lambdaDefinition: Serverless["functions"] | undefined

  constructor() {
    this.app = new OpenAPIHono<T>()
  }

  importActions(actionDefinitions: ActionDefinition<T>[]): void {
    this.actions.push(...actionDefinitions)
    for (const k in actionDefinitions) {
      actionDefinitions[k].buildOpenApiAppRoute(this.app)
    }
  }

  defineLambdaDefinition(definition: Serverless["functions"]) {
    this.lambdaDefinition = definition
  }

  setCorsSetting(cors: HttpCors) {
    this.corsSetting = cors
  }

  getApp(): OpenAPIHono<T> {
    return this.app
  }

  getLambdaDefinition(): Serverless["functions"] {
    if (!this.lambdaDefinition) {
      throw new Error("Lambda関数設定が定義されていません")
    }

    if (this.corsSetting) {
      Object.entries(this.lambdaDefinition).forEach(([_, definition]) => {
        for (const event of definition.events ?? []) {
          if (event.http) {
            event.http.cors = this.corsSetting
          }
        }
      })
    }

    return this.lambdaDefinition
  }

  buildOpenApiRoute() {
    for (const k in this.actions) {
      this.actions[k].buildOpenApiAppRoute(this.app)
    }
  }
}