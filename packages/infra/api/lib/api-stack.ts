import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import * as path from 'path'

interface ApiStackProps extends cdk.StackProps {
  stage: string
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const { stage } = props

    // Lambda Layers
    const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../../../lambda-layers/common'),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies layer',
    })

    const openaiLayer = new lambda.LayerVersion(this, 'OpenaiLayer', {
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../../../lambda-layers/openai'),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'OpenAI SDK layer',
    })

    // SQS Queues
    const feedAnalyzeDlq = new sqs.Queue(this, 'FeedAnalyzeDlq', {
      queueName: 'FeedAnalyzeDlq',
      retentionPeriod: cdk.Duration.days(14), // 1209600 seconds
    })

    const feedAnalyzeQueue = new sqs.Queue(this, 'FeedAnalyzeQueue', {
      queueName: 'FeedAnalyzeQueue',
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: feedAnalyzeDlq,
        maxReceiveCount: 5,
      },
    })

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })

    // Add permissions to the role
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    )

    // Permissions for Secrets Manager
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:${stage}/supabase/db_url*`,
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:openai*`,
        ],
      }),
    )

    // Permissions for X-Ray
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      }),
    )

    // Permissions for SQS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage'],
        resources: [feedAnalyzeQueue.queueArn],
      }),
    )

    // Common Lambda environment variables
    const commonEnvironment = {
      STAGE: stage,
      TZ: 'Asia/Tokyo',
      NODE_OPTIONS: '--import=/opt/nodejs/otel-setup.mjs',
      API_URL: process.env.API_URL || '',
      DATABASE_URL:
        process.env.DATABASE_URL ||
        `{{resolve:secretsmanager:${stage}/supabase/db_url}}`,
      OPENAI_API_KEY:
        process.env.OPENAI_API_KEY ||
        '{{resolve:secretsmanager:openai:api_key}}',
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || '',
      ANALYZE_FEED_LOG_QUEUE_URL: feedAnalyzeQueue.queueUrl,
    }

    // Common Lambda function props
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      environment: commonEnvironment,
      tracing: lambda.Tracing.ACTIVE,
      role: lambdaRole,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'OtelLayer',
          `arn:aws:lambda:${this.region}:${this.account}:layer:otel-collector:7`,
        ),
        commonLayer,
      ],
      bundling: {
        minify: false,
        sourceMap: true,
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

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ChaseLight-api', {
      restApiName: `chase-light-api-${stage}`,
      description: `Chase Light API - ${stage}`,
      deployOptions: {
        stageName: stage,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      minCompressionSize: cdk.Size.kibibytes(1),
    })

    // ユーザーAPI
    const userApiLambda = new lambda.Function(this, 'UserApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-api-user-${stage}`,
      handler: 'src/handlers/api-gateway/user/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'User API Lambda function',
    })

    const userApiResource = api.root.addResource('user')
    userApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(userApiLambda),
    })

    // フィードAPI
    const feedApiLambda = new lambda.Function(this, 'FeedApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-api-feed-${stage}`,
      handler: 'src/handlers/api-gateway/feed/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'Feed API Lambda function',
      layers: [...commonLambdaProps.layers, openaiLayer],
    })

    const feedApiResource = api.root.addResource('feed')
    feedApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(feedApiLambda),
    })

    // 通知API
    const notificationApiLambda = new lambda.Function(
      this,
      'NotificationApiFunction',
      {
        ...commonLambdaProps,
        functionName: `chase-light-api-notification-${stage}`,
        handler: 'src/handlers/api-gateway/notification/index.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Notification API Lambda function',
      },
    )

    const notificationApiResource = api.root.addResource('notification')
    notificationApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(
        notificationApiLambda,
      ),
    })

    // OpenAPI UI
    const openApiLambda = new lambda.Function(this, 'OpenApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-api-openapi-${stage}`,
      handler: 'src/handlers/api-gateway/open-api/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'OpenAPI UI Lambda function',
    })

    const openApiResource = api.root.addResource('api')
    openApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(openApiLambda),
    })

    // Step Functions Handlers
    const analyzeRequestHandler = new lambda.Function(
      this,
      'AnalyzeRequestHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-api-feedAnalyzer-analyzeRequest-${stage}`,
        handler:
          'src/handlers/step-functions/feed-analyzer/analyze-request.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Feed Analyzer Request Handler',
        layers: [...commonLambdaProps.layers, openaiLayer],
      },
    )

    const summarizeHandler = new lambda.Function(this, 'SummarizeHandler', {
      ...commonLambdaProps,
      functionName: `chase-light-api-feedAnalyzer-summarize-${stage}`,
      handler: 'src/handlers/step-functions/feed-analyzer/summarize.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'Feed Analyzer Summarize Handler',
      layers: [...commonLambdaProps.layers, openaiLayer],
    })

    const updateFeedLogHandler = new lambda.Function(
      this,
      'UpdateFeedLogHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-api-feedAnalyzer-updateFeedLog-${stage}`,
        handler:
          'src/handlers/step-functions/feed-analyzer/update-feed-log.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Feed Analyzer Update Feed Log Handler',
      },
    )

    // Step Functions State Machine
    const feedAnalyzerStateMachineDefinition = new sfn.Pass(this, 'Start')
      .next(
        new sfn.Task(this, 'AnalyzeRequest', {
          task: new sfn.LambdaInvoke(this, 'AnalyzeRequestTask', {
            lambdaFunction: analyzeRequestHandler,
          }),
          resultPath: '$.analyzeResult',
        }),
      )
      .next(
        new sfn.Task(this, 'Summarize', {
          task: new sfn.LambdaInvoke(this, 'SummarizeTask', {
            lambdaFunction: summarizeHandler,
          }),
          resultPath: '$.summaryResult',
        }),
      )
      .next(
        new sfn.Task(this, 'UpdateFeedLog', {
          task: new sfn.LambdaInvoke(this, 'UpdateFeedLogTask', {
            lambdaFunction: updateFeedLogHandler,
          }),
          resultPath: '$.updateFeedLogResult',
        }),
      )
      .next(new sfn.Pass(this, 'Complete'))

    const feedAnalyzerStateMachine = new sfn.StateMachine(
      this,
      'FeedAnalyzerStateMachine',
      {
        stateMachineName: `FeedAnalyzer-${stage}`,
        definition: feedAnalyzerStateMachineDefinition,
        timeout: cdk.Duration.minutes(5),
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, 'FeedAnalyzerLogs', {
            logGroupName: `/aws/states/FeedAnalyzer-${stage}`,
            retention: logs.RetentionDays.ONE_WEEK,
          }),
          level: sfn.LogLevel.ALL,
        },
      },
    )

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    })

    new cdk.CfnOutput(this, 'FeedAnalyzeQueueUrl', {
      value: feedAnalyzeQueue.queueUrl,
      description: 'Feed Analyze Queue URL',
    })

    new cdk.CfnOutput(this, 'FeedAnalyzerStateMachineArn', {
      value: feedAnalyzerStateMachine.stateMachineArn,
      description: 'Feed Analyzer State Machine ARN',
    })
  }
}
