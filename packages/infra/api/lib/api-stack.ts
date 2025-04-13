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
        actions: [
          'sqs:SendMessage',
          'sqs:GetQueueUrl',
          'sqs:GetQueueAttributes',
        ],
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
    const commonLambdaProps: cdk.aws_lambda.FunctionProps = {
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
        minify: true,
        SourceMap: true,
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
      restApiName: `chase-light-${stage}-api`,
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
      functionName: `chase-light-${stage}-api-user`,
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
      functionName: `chase-light-${stage}-api-feed`,
      handler: 'src/handlers/api-gateway/feed/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'Feed API Lambda function',
      layers: [...commonLambdaProps.layers!, openaiLayer],
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
        functionName: `chase-light-${stage}-api-notification`,
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
      functionName: `chase-light-${stage}-api-openapi`,
      handler: 'src/handlers/api-gateway/open-api/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'OpenAPI UI Lambda function',
    })

    const openApiResource = api.root.addResource('api')
    openApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(openApiLambda),
    })

    // Step Functions Handlers
    const listFeedHandler = new lambda.Function(this, 'listFeedHandler', {
      ...commonLambdaProps,
      functionName: `chase-light-${stage}-api-feedAnalyzer-listFeedHandler`,
      handler:
        'src/handlers/step-functions/feed-analyzer/handlers/list-feed-handler.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
      description: 'List Feed Handler Lambda function',
    })

    const createFeedLogsHandler = new lambda.Function(
      this,
      'createFeedLogsHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-createFeedLogsHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/create-feed-logs.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Create Feed Logs Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    const enqueuePendingFeedLogHandler = new lambda.Function(
      this,
      'enqueuePendingFeedLogHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-enqueuePendingFeedLogHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Enqueue Pending Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    const analyzeFeedLogHandler = new lambda.Function(
      this,
      'analyzeFeedLogHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-analyzeFeedLogHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/analyze-feed-log-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Analyze Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    const notifyUpdateHandler = new lambda.Function(
      this,
      'notifyUpdateHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-notifyUpdateHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/notify-update-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../api')),
        description: 'Notify Update Handler Lambda function',
      },
    )

    // Step Functions State Machine
    const feedAnalyzerStateMachine = new sfn.StateMachine(
      this,
      'FeedAnalyzer',
      {
        stateMachineName: `chase-light-${stage}-FeedAnalyzer`,
        definitionBody: sfn.DefinitionBody.fromObject({
          StartAt: 'ListFeeds',
          QueryLanguage: 'JSONata',
          States: {
            ListFeeds: {
              Type: 'Task',
              Resource: listFeedHandler.functionArn,
              Assign: {
                feedIdList: '{% $states.result.feedIds %}',
              },
              Next: 'CreateFeedLogCollections',
            },
            CreateFeedLogCollections: {
              Type: 'Map',
              Items: '{% $feedIdList %}',
              MaxConcurrency: 3,
              ItemProcessor: {
                StartAt: 'CreateFeedLogs',
                States: {
                  CreateFeedLogs: {
                    Type: 'Task',
                    Resource: createFeedLogsHandler.functionArn,
                    Assign: {
                      feedLogs: '{% $states.result %}',
                    },
                    Catch: [
                      {
                        ErrorEquals: ['States.ALL'],
                        Assign: {
                          errorDetail: '{% $states.errorOutput %}',
                        },
                        Next: 'Error',
                      },
                    ],
                    End: true,
                  },
                  Error: {
                    Type: 'Pass',
                    Output: {
                      error: '{% $errorDetail %}',
                    },
                    End: true,
                  },
                },
              },
              Next: 'EnqueuePendingFeedLog',
            },
            EnqueuePendingFeedLog: {
              Type: 'Task',
              Resource: enqueuePendingFeedLogHandler.functionArn,
              Next: 'NotifyUpdate',
            },
            NotifyUpdate: {
              Type: 'Task',
              Resource: notifyUpdateHandler.functionArn,
              End: true,
            },
          },
        }),
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, 'FeedAnalyzerLogGroup', {
            logGroupName: `/aws/states/chase-light-${stage}-FeedAnalyzer`,
            retention: logs.RetentionDays.TWO_WEEKS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: sfn.LogLevel.ALL,
        },
      },
    )

    // Grant permissions to invoke Lambda functions
    listFeedHandler.grantInvoke(feedAnalyzerStateMachine.role)
    createFeedLogsHandler.grantInvoke(feedAnalyzerStateMachine.role)
    enqueuePendingFeedLogHandler.grantInvoke(feedAnalyzerStateMachine.role)
    analyzeFeedLogHandler.grantInvoke(feedAnalyzerStateMachine.role)
    notifyUpdateHandler.grantInvoke(feedAnalyzerStateMachine.role)

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
