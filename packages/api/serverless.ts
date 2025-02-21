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
      external: [
        'aws-lambda',
        '@prisma/client',
        'openai',
        'zod',
        '@opentelemetry/*',
      ],
      platform: 'node',
      sourcemap: {
        type: 'linked',
        setNodeOptions: true,
      },
      exclude: ['openai', '@opentelemetry/*'],
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
  custom: {
    openAiApiKey:
      '${env:OPENAI_API_KEY, ssm:/aws/reference/secretsmanager/openai:api_key}',
  },
  layers: {
    common: {
      path: '../lambda-layers/common',
      compatibleRuntimes: ['nodejs20.x'],
      retain: true,
    },
    openai: {
      path: '../lambda-layers/openai',
      compatibleRuntimes: ['nodejs20.x'],
      retain: true,
    },
  },
  provider: {
    name: 'aws',
    stage: '${opt:stage, "local"}',
    runtime: 'nodejs20.x',
    region: 'ap-northeast-1',
    memorySize: 512,
    environment: {
      STAGE: '${sls:stage}',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      // AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
      NODE_OPTIONS: '--require lambda-wrapper',

      API_URL: '${env:API_URL}',
      DATABASE_URL:
        '${env:DATABASE_URL, ssm:/aws/reference/secretsmanager/${sls:stage}/supabase/db_url}',
      OPENAI_API_KEY: '${self:custom.openAiApiKey}',
      AUTH0_DOMAIN: '${env:AUTH0_DOMAIN}',
      ANALYZE_FEED_LOG_QUEUE_URL: { Ref: 'FeedAnalyzeQueue' },
    },
    tracing: {
      apiGateway: true,
      lambda: true,
    },
    layers: [
      'arn:aws:lambda:ap-northeast-1:955192521523:layer:otel-collector:4',
      'arn:aws:lambda:${env:AWS_REGION}:${env:AWS_ACCOUNT}:layer:common:4',
    ],
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
      {
        Effect: 'Allow',
        Action: ['sqs:SendMessage'],
        Resource: { 'Fn::GetAtt': ['FeedAnalyzeQueue', 'Arn'] },
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
  resources: {
    Resources: {
      FeedAnalyzeDlq: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'FeedAnalyzeDlq',
          MessageRetentionPeriod: 1209600,
        },
      },
      FeedAnalyzeQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'FeedAnalyzeQueue',
          VisibilityTimeout: 300,
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['FeedAnalyzeDlq', 'Arn'] },
            maxReceiveCount: 5,
          },
        },
      },
    },
  },
}

module.exports = serverlessConfiguration
