// Lambda関数の設定定義
export const lambdaConfigs = {
  "list-detect-targets": {
    name: "list-detect-targets-lambda",
    description: "List detect targets for monitoring",
    entryPoint: "./src/features/detection/workers/list-detect-targets/index.ts",
    // バンドルから除外するパッケージ（node_modulesにインストールされる）
    externalPackages: ["@aws-sdk/*", "aws-sdk", "pg", "drizzle-orm", "dotenv"],
    // Lambda関数のpackage.jsonに含める依存関係
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
    },
  },
  "detect-datasource-updates": {
    name: "detect-datasource-updates-lambda",
    description: "Detect updates for a data source",
    entryPoint:
      "./src/features/detection/workers/detect-datasource-updates/index.ts",
    // バンドルから除外するパッケージ（node_modulesにインストールされる）
    externalPackages: [
      "@aws-sdk/*",
      "aws-sdk",
      "pg",
      "drizzle-orm",
      "dotenv",
      "@octokit/rest",
      "jsonwebtoken",
      "jwks-rsa",
    ],
    // Lambda関数のpackage.jsonに含める依存関係
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      "@octokit/rest": "^22.0.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
      jsonwebtoken: "^9.0.2",
      "jwks-rsa": "^3.0.1",
    },
  },
  "process-updates": {
    name: "process-updates-lambda",
    description:
      "Process updates for events (SQS handler and direct invocation)",
    entryPoint: "./src/features/detection/workers/process-updates/index.ts",
    // バンドルから除外するパッケージ（node_modulesにインストールされる）
    externalPackages: [
      "@aws-sdk/*",
      "aws-sdk",
      "pg",
      "drizzle-orm",
      "dotenv",
      "openai",
      "jsonwebtoken",
      "jwks-rsa",
    ],
    // Lambda関数のpackage.jsonに含める依存関係
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      openai: "^6.3.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
      jsonwebtoken: "^9.0.2",
      "jwks-rsa": "^3.0.1",
    },
  },
  "generate-digest-notifications": {
    name: "generate-digest-notifications-lambda",
    description:
      "Generate digest notifications for subscribed users based on activities",
    entryPoint:
      "./src/features/notification/workers/generate-digest-notifications/index.ts",
    externalPackages: [
      "@aws-sdk/*",
      "aws-sdk",
      "pg",
      "drizzle-orm",
      "dotenv",
      "luxon",
      "jsonwebtoken",
      "jwks-rsa",
    ],
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
      luxon: "^3.6.1",
      jsonwebtoken: "^9.0.2",
      "jwks-rsa": "^3.0.1",
    },
  },
  "translate-activity-body": {
    name: "translate-activity-body-lambda",
    description: "Translate activity body content via SQS trigger",
    entryPoint:
      "./src/features/activities/workers/translate-activity-body/index.ts",
    externalPackages: [
      "@aws-sdk/*",
      "aws-sdk",
      "pg",
      "drizzle-orm",
      "dotenv",
      "openai",
    ],
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      openai: "^6.3.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
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
