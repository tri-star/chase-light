import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import {
  NodejsFunction,
  NodejsFunctionProps,
  OutputFormat,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import * as path from 'path'

export interface LambdaCommonProps {
  stage: string
  lambdaRole: iam.Role
  commonLayer: lambda.ILayerVersion
  otelLayer: lambda.ILayerVersion
  feedAnalyzeQueue: sqs.Queue
}

export class LambdaCommon extends Construct {
  public readonly commonEnvironment: Record<string, string>
  public readonly commonLambdaProps: Omit<
    cdk.aws_lambda.FunctionProps,
    'code' | 'handler'
  >
  public readonly commonNodejsProps: Omit<
    NodejsFunctionProps,
    'entry' | 'handler'
  >
  public readonly apiBasePath: string

  constructor(scope: Construct, id: string, props: LambdaCommonProps) {
    super(scope, id)

    const { stage, lambdaRole, commonLayer, otelLayer, feedAnalyzeQueue } =
      props

    // API基本パス
    this.apiBasePath = path.resolve(__dirname, '../../../../api')

    // 共通の環境変数
    this.commonEnvironment = {
      STAGE: stage,
      TZ: 'Asia/Tokyo',
      NODE_OPTIONS: '--import=/opt/nodejs/otel-setup.mjs',
      API_URL: process.env.API_URL || '',
      DATABASE_URL:
        process.env.DATABASE_URL || `{{resolve:ssm:/${stage}/supabase/db_url}}`,
      OPENAI_API_KEY:
        process.env.OPENAI_API_KEY ||
        `{{resolve:ssm:/${stage}/openai/api_key}}`,
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || '',
      ANALYZE_FEED_LOG_QUEUE_URL: feedAnalyzeQueue.queueUrl,
    }

    // 共通のLambda関数プロパティ
    this.commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      environment: this.commonEnvironment,
      tracing: lambda.Tracing.ACTIVE,
      role: lambdaRole,
      layers: [otelLayer, commonLayer],
    }

    // NodejsFunction用の共通プロパティ
    this.commonNodejsProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      environment: this.commonEnvironment,
      tracing: lambda.Tracing.ACTIVE,
      role: lambdaRole,
      layers: [otelLayer, commonLayer],
      bundling: {
        minify: true,
        sourceMap: true,
        format: OutputFormat.ESM,
        externalModules: [
          'aws-lambda',
          '@prisma/client',
          'openai',
          'zod',
          '@opentelemetry/*',
        ],
        nodeModules: ['@prisma/client'],
      },
    }
  }
}
