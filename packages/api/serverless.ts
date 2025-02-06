// Requiring @types/serverless in your project package.json
import { feedApp } from '@/handlers/api-gateway/feed'
import { userApp } from '@/handlers/api-gateway/user'
import { scalerUiApp } from '@/handlers/api-gateway/open-api'
import type { Serverless } from 'serverless/aws'

import {
  feedAnalyzerStateMachine,
  feedAnalyzerHandlers,
} from '@/handlers/step-functions/feed-analyzer'

function buildStateMachineHandlers(prefix: string, handlers: object) {
  return Object.entries(handlers).reduce((acc, [key, handler]) => {
    return {
      ...acc,
      [`${prefix}-${key}`]: handler,
    }
  }, {})
}

// serverless.ts
const serverlessConfiguration: Serverless & { build: object } = {
  org: 'tristar',
  app: 'chase-light-dev',
  service: 'chase-light-api',
  configValidationMode: 'error',
  frameworkVersion: '4',
  plugins: ['serverless-offline', 'serverless-step-functions'],
  build: {
    esbuild: {
      bundle: true,
      minify: false,
      buildConcurrency: 3,
      external: ['aws-lambda', '@prisma/client'],
      platform: 'node',
      sourcemap: {
        type: 'linked',
        setNodeOptions: true,
      },
    },
  },
  package: {
    patterns: [
      'package.json',
      'node_modules/.prisma/client/**',
      '!node_modules/.prisma/client/libquery_engine-*',
      'node_modules/.prisma/client/libquery_engine-rhel-*',
      '!node_modules/prisma/libquery_engine-*',
      '!node_modules/@prisma/engines/**',

      // "node_modules/.prisma/client/**",
      // "!node_modules/.prisma/client/libquery_engine-*",
      // "node_modules/.prisma/client/libquery_engine-rhel-*",
      // "node_modules/@prisma/**",
      // "!node_modules/@prisma/engines/**",
    ],
    individually: true,
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'ap-northeast-1',
    memorySize: 512,
    environment: {
      STAGE: '${sls:stage}',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      // NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",

      API_URL: '${env:API_URL}',
      DATABASE_URL:
        '${env:DATABASE_URL, ssm:/aws/reference/secretsmanager/${sls:stage}/supabase/db_url}',
      AUTH0_DOMAIN: '${env:AUTH0_DOMAIN}',
    },
    tracing: {
      apiGateway: true,
      lambda: true,
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        Resource:
          'arn:aws:secretsmanager:${env:AWS_REGION}:${env:AWS_ACCOUNT}:secret:${sls:stage}/supabase/db_url',
      },
      {
        Effect: 'Allow',
        Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        Resource: '*',
      },
    ],
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    ...userApp.getLambdaDefinition(),
    ...feedApp.getLambdaDefinition(),
    ...scalerUiApp.getLambdaDefinition(),
    ...buildStateMachineHandlers('feedAnalyzer', feedAnalyzerHandlers),
  },
  stepFunctions: {
    stateMachines: {
      FeedAnalyzer: feedAnalyzerStateMachine,
    },
  },
}

module.exports = serverlessConfiguration
