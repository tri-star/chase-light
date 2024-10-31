// Requiring @types/serverless in your project package.json
import type { Serverless } from "serverless/aws"
// serverless.ts
const serverlessConfiguration: Serverless & { build: object } = {
  org: "tristar",
  app: "chase-light-dev",
  service: "chase-light-api",
  configValidationMode: "error",
  frameworkVersion: "4",
  build: {
    esbuild: {
      bundle: true,
      minify: false,
      buildConcurrency: 3,
      external: ["aws-lambda", "@prisma/client"],
      target: "node18",
      platform: "node",
      sourcemap: {
        type: "linked",
        setNodeOptions: true,
      },
    },
  },
  package: {
    patterns: [
      "package.json",
      "node_modules/.prisma/client/**",
      "!node_modules/.prisma/client/libquery_engine-*",
      "node_modules/.prisma/client/libquery_engine-rhel-*",
      "node_modules/@prisma/**",
      "!node_modules/@prisma/engines/**",
    ],
  },
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "ap-northeast-1",
    memorySize: 512,
    environment: {
      DATABASE_URL:
        "${env:DATABASE_URL, ssm:/aws/reference/secretsmanager/${sls:stage}/supabase/db_url}}",
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      // NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      STAGE: "${sls:stage}",
    },
    tracing: {
      apiGateway: true,
      lambda: true,
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ],
        Resource:
          "arn:aws:secretsmanager:${env:AWS_REGION}:${env:AWS_ACCOUNT}:secret:${sls:stage}/supabase/db_url",
      },
      {
        Effect: "Allow",
        Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        Resource: "*",
      },
    ],
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    hello: {
      handler: "src/handler.hello",
      events: [
        {
          httpApi: {
            method: "get",
            path: "/",
          },
        },
      ],
    },
  },
}

module.exports = serverlessConfiguration
