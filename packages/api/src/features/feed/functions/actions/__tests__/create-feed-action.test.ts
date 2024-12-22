import type { AppContext } from "@/app/chase-light-app"
import { StubTokenParser } from "@/features/auth/services/stub-token-parser"
import { swapTokenParserForTest } from "@/features/auth/services/token-parser"
import type { CreateFeedRequest, Feed } from "@/features/feed/domain/feed"
import { feedApp } from "@/features/feed/functions"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { UserFactory } from "prisma/seeds/user-factory"
import { beforeEach, describe, expect, test } from "vitest"

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = feedApp.getApp()
})

describe("CreateFeedAction", () => {
  test("フィードを作成できること", async () => {
    const stubTokenParser = new StubTokenParser()
    const user = await UserFactory.create()

    stubTokenParser.setUser(user)
    swapTokenParserForTest(stubTokenParser)

    const request: CreateFeedRequest = {
      name: "test feed",
      url: "https://github.com/abc/def",
      cycle: 1, // CYCLE_VALUE_MAP.DAILY
    }

    const result = await app.request("/feeds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
    expect(result.status).toBe(200)
    expect(((await result.json()) as { feed: Feed }).feed.name).toBe(
      request.name,
    )
  })
})
