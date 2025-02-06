import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const postUserssignupViaProvider_Body = z
  .object({ accessToken: z.string(), idToken: z.string() })
  .strict()
  .passthrough()
  .readonly();
const postFeeds_Body = z
  .object({
    name: z.string().max(50),
    url: z.string().max(255),
    cycle: z.union([z.literal(1), z.literal(2)]),
  })
  .strict()
  .passthrough()
  .readonly();

export const schemas = {
  postUserssignupViaProvider_Body,
  postFeeds_Body,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/feed-logs",
    alias: "getFeedLogs",
    requestFormat: "json",
    response: z
      .object({
        result: z
          .array(
            z
              .object({
                id: z.string(),
                feed: z
                  .object({ id: z.string(), name: z.string() })
                  .strict()
                  .passthrough()
                  .readonly(),
                date: z.union([z.string(), z.string()]),
                title: z.string(),
                summary: z.string(),
                url: z.string(),
                status: z.enum([
                  "wait",
                  "in_progress",
                  "error",
                  "failed",
                  "done",
                ]),
                createdAt: z.union([z.string(), z.string()]),
                updatedAt: z.union([z.string(), z.string()]),
              })
              .strict()
              .passthrough()
              .readonly()
          )
          .readonly(),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 401,
        description: `認証エラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        description: `予期しないエラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
  {
    method: "post",
    path: "/feeds",
    alias: "postFeeds",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postFeeds_Body,
      },
    ],
    response: z
      .object({
        feed: z
          .object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            cycle: z.union([z.literal(1), z.literal(2)]),
            dataSource: z
              .object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .strict()
              .passthrough()
              .readonly(),
            feedGitHubMeta: z
              .object({
                id: z.string(),
                lastReleaseDate: z.string().optional(),
              })
              .strict()
              .passthrough()
              .readonly()
              .optional(),
            user: z
              .object({
                id: z.string(),
                displayName: z.string(),
                accountName: z.string(),
                email: z.string(),
                emailVerified: z.boolean(),
                providerId: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .strict()
              .passthrough()
              .readonly(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
          .strict()
          .passthrough()
          .readonly(),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 400,
        description: `バリデーションエラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 401,
        description: `認証エラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        description: `予期しないエラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
  {
    method: "get",
    path: "/feeds",
    alias: "getFeeds",
    requestFormat: "json",
    parameters: [
      {
        name: "keyword",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sort",
        type: "Query",
        schema: z.enum(["createdAt", "updatedAt"]).optional(),
      },
      {
        name: "sortDirection",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional(),
      },
    ],
    response: z
      .object({
        result: z
          .array(
            z
              .object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                cycle: z.union([z.literal(1), z.literal(2)]),
                dataSource: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                    url: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  })
                  .strict()
                  .passthrough()
                  .readonly(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .strict()
              .passthrough()
              .readonly()
          )
          .readonly(),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 401,
        description: `認証エラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        description: `予期しないエラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
  {
    method: "get",
    path: "/feeds/validate-url",
    alias: "getFeedsvalidateUrl",
    description: `フィードURLの重複チェック、形式チェック`,
    requestFormat: "json",
    parameters: [
      {
        name: "url",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z
      .object({
        success: z.boolean(),
        code: z.enum(["duplicated", "not-supported"]).optional(),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 400,
        description: `バリデーションエラー(URLの形式違反など)`,
        schema: z
          .object({
            success: z.boolean(),
            code: z.enum(["duplicated", "not-supported"]).optional(),
          })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 401,
        description: `認証エラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 409,
        description: `重複エラー`,
        schema: z
          .object({
            success: z.boolean(),
            code: z.enum(["duplicated", "not-supported"]).optional(),
          })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        description: `予期しないエラー`,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
  {
    method: "get",
    path: "/users/self",
    alias: "getUsersself",
    requestFormat: "json",
    response: z
      .object({
        user: z
          .object({
            id: z.string(),
            displayName: z.string(),
            accountName: z.string(),
            email: z.string(),
            emailVerified: z.boolean(),
            providerId: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
          .strict()
          .passthrough()
          .readonly(),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 401,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
  {
    method: "post",
    path: "/users/signup-via-provider",
    alias: "postUserssignupViaProvider",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postUserssignupViaProvider_Body,
      },
    ],
    response: z
      .object({
        user: z
          .object({
            id: z.string(),
            displayName: z.string(),
            accountName: z.string(),
            email: z.string(),
            emailVerified: z.boolean(),
            providerId: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
          .strict()
          .passthrough()
          .readonly()
          .optional(),
        success: z.boolean(),
        status: z.enum([
          "created",
          "updated",
          "duplicate_account",
          "no_verified_email",
        ]),
      })
      .strict()
      .passthrough()
      .readonly(),
    errors: [
      {
        status: 400,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
      {
        status: 500,
        schema: z
          .object({ error: z.string() })
          .strict()
          .passthrough()
          .readonly(),
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
