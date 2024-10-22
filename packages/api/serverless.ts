// Requiring @types/serverless in your project package.json
import type { Serverless } from "serverless/aws";
// serverless.ts
const serverlessConfiguration: Serverless = {
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
      external: [
        "aws-lambda",
        "@prisma/client",
      ],
      target: "node20",
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
      '!node_modules/.prisma/client/libquery_engine-*',
      'node_modules/.prisma/client/libquery_engine-rhel-*',
      "node_modules/@prisma/**",
      "!node_modules/@prisma/engines/**",
    ],
  },
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    region: "ap-northeast-1",
    environment: {
      DATABASE_URL: "${env:DATABASE_URL}"
    }
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
};

module.exports = serverlessConfiguration;
