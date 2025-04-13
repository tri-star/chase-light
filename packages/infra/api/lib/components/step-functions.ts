import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import * as path from 'path'

export interface StepFunctionsProps {
  stage: string
  commonLambdaProps: cdk.aws_lambda.FunctionProps
}

export class StepFunctionResources extends Construct {
  public readonly listFeedHandler: lambda.Function
  public readonly createFeedLogsHandler: lambda.Function
  public readonly enqueuePendingFeedLogHandler: lambda.Function
  public readonly analyzeFeedLogHandler: lambda.Function
  public readonly notifyUpdateHandler: lambda.Function
  public readonly feedAnalyzerStateMachine: sfn.StateMachine

  constructor(scope: Construct, id: string, props: StepFunctionsProps) {
    super(scope, id)

    const { stage, commonLambdaProps } = props

    // Lambda関数の作成
    this.listFeedHandler = new lambda.Function(this, 'listFeedHandler', {
      ...commonLambdaProps,
      functionName: `chase-light-${stage}-api-feedAnalyzer-listFeedHandler`,
      handler:
        'src/handlers/step-functions/feed-analyzer/handlers/list-feed-handler.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
      description: 'List Feed Handler Lambda function',
    })

    this.createFeedLogsHandler = new lambda.Function(
      this,
      'createFeedLogsHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-createFeedLogsHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/create-feed-logs.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
        description: 'Create Feed Logs Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.enqueuePendingFeedLogHandler = new lambda.Function(
      this,
      'enqueuePendingFeedLogHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-enqueuePendingFeedLogHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
        description: 'Enqueue Pending Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.analyzeFeedLogHandler = new lambda.Function(
      this,
      'analyzeFeedLogHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-analyzeFeedLogHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/analyze-feed-log-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
        description: 'Analyze Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.notifyUpdateHandler = new lambda.Function(
      this,
      'notifyUpdateHandler',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-notifyUpdateHandler`,
        handler:
          'src/handlers/step-functions/feed-analyzer/handlers/notify-update-handler.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
        description: 'Notify Update Handler Lambda function',
      },
    )

    // Step Functions State Machine
    this.feedAnalyzerStateMachine = new sfn.StateMachine(
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
              Resource: this.listFeedHandler.functionArn,
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
                    Resource: this.createFeedLogsHandler.functionArn,
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
              Resource: this.enqueuePendingFeedLogHandler.functionArn,
              Next: 'NotifyUpdate',
            },
            NotifyUpdate: {
              Type: 'Task',
              Resource: this.notifyUpdateHandler.functionArn,
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

    // Lambda関数の実行権限を付与
    this.listFeedHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.createFeedLogsHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.enqueuePendingFeedLogHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.analyzeFeedLogHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.notifyUpdateHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
  }
}