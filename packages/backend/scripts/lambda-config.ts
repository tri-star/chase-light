export type LambdaConfig = {
  name: string
  description: string
  entryPoint: string
  additionalDependencies?: string[]
  dependencyOverrides?: Record<string, string>
  skipDefaultDependencies?: boolean
  externalPackages?: string[]
  skipDefaultExternalPackages?: boolean
}

export const lambdaDefaults = {
  importer: "packages/backend",
  defaultDependencies: ["@aws-sdk/client-ssm", "pg", "drizzle-orm", "dotenv"],
  defaultExternalPackages: [
    "@aws-sdk/*",
    "aws-sdk",
    "pg",
    "drizzle-orm",
    "dotenv",
  ],
}

export const lambdaConfigs: Record<string, LambdaConfig> = {
  "list-detect-targets": {
    name: "list-detect-targets-lambda",
    description: "List detect targets for monitoring",
    entryPoint: "./src/features/detection/workers/list-detect-targets/index.ts",
  },
  "detect-datasource-updates": {
    name: "detect-datasource-updates-lambda",
    description: "Detect updates for a data source",
    entryPoint:
      "./src/features/detection/workers/detect-datasource-updates/index.ts",
    additionalDependencies: ["@octokit/rest", "jsonwebtoken", "jwks-rsa"],
    externalPackages: ["@octokit/rest", "jsonwebtoken", "jwks-rsa"],
  },
  "process-updates": {
    name: "process-updates-lambda",
    description:
      "Process updates for events (SQS handler and direct invocation)",
    entryPoint: "./src/features/detection/workers/process-updates/index.ts",
    additionalDependencies: ["openai", "jsonwebtoken", "jwks-rsa"],
    externalPackages: ["openai", "jsonwebtoken", "jwks-rsa"],
  },
  "generate-digest-notifications": {
    name: "generate-digest-notifications-lambda",
    description:
      "Generate digest notifications for subscribed users based on activities",
    entryPoint:
      "./src/features/notification/workers/generate-digest-notifications/index.ts",
    additionalDependencies: ["luxon", "jsonwebtoken", "jwks-rsa"],
    externalPackages: ["luxon", "jsonwebtoken", "jwks-rsa"],
  },
  "translate-activity-body": {
    name: "translate-activity-body-lambda",
    description: "Translate activity body content via SQS trigger",
    entryPoint:
      "./src/features/activities/workers/translate-activity-body/index.ts",
    additionalDependencies: ["openai"],
    externalPackages: ["openai"],
  },
  api: {
    name: "backend-api-lambda",
    description: "Hono-based API handler",
    entryPoint: "./src/index.ts",
    skipDefaultDependencies: true,
    additionalDependencies: [
      "hono",
      "@hono/zod-openapi",
      "@hono/zod-validator",
      "@scalar/hono-api-reference",
      "pg",
      "drizzle-orm",
      "dotenv",
      "jsonwebtoken",
      "jwks-rsa",
      "zod",
      "uuidv7",
    ],
    externalPackages: [
      "pg",
      "drizzle-orm",
      "dotenv",
      "jsonwebtoken",
      "jwks-rsa",
    ],
    dependencyOverrides: {
      // hono 4.x requires @hono/node-server only for local dev; Lambdaでは不要
      hono: "4.10.2",
    },
  },
}

// デフォルトのesbuild設定
export const defaultEsbuildConfig = {
  platform: "node",
  target: "node20",
  format: "esm",
  bundle: true,
  sourcemap: "external",
  minify: false,
}

// デフォルトのpackage.json設定
export const defaultPackageJsonConfig = {
  version: "1.0.0",
  type: "module",
  engines: {
    node: ">=20.0.0",
  },
}
