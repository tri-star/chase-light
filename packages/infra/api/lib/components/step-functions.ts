import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as logs from 'aws-cdk-lib/aws-logs'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import * as path from 'path'
import * as fs from 'fs'

export interface StepFunctionsProps {
  stage: string
  commonLambdaProps: Omit<cdk.aws_lambda.FunctionProps, 'code' | 'handler'>
  commonNodejsProps: Omit<NodejsFunctionProps, 'entry' | 'handler'>
  apiBasePath: string
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

    const { stage, commonLambdaProps, commonNodejsProps, apiBasePath } = props

    // Lambda関数の作成
    this.listFeedHandler = new NodejsFunction(this, 'listFeedHandler', {
      ...commonNodejsProps,
      functionName: `chase-light-${stage}-api-feedAnalyzer-listFeedHandler`,
      entry: path.join(
        apiBasePath,
        'src/handlers/step-functions/feed-analyzer/handlers/list-feed-handler.ts',
      ),
      handler: 'handler',
      description: 'List Feed Handler Lambda function',
    })

    this.createFeedLogsHandler = new NodejsFunction(
      this,
      'createFeedLogsHandler',
      {
        ...commonNodejsProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-createFeedLogsHandler`,
        entry: path.join(
          apiBasePath,
          'src/handlers/step-functions/feed-analyzer/handlers/create-feed-logs.ts',
        ),
        handler: 'handler',
        description: 'Create Feed Logs Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.enqueuePendingFeedLogHandler = new NodejsFunction(
      this,
      'enqueuePendingFeedLogHandler',
      {
        ...commonNodejsProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-enqueuePendingFeedLogHandler`,
        entry: path.join(
          apiBasePath,
          'src/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler.ts',
        ),
        handler: 'handler',
        description: 'Enqueue Pending Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.analyzeFeedLogHandler = new NodejsFunction(
      this,
      'analyzeFeedLogHandler',
      {
        ...commonNodejsProps,
        functionName: `chase-light-${stage}-api-feedAnalyzer-analyzeFeedLogHandler`,
        entry: path.join(
          apiBasePath,
          'src/handlers/step-functions/feed-analyzer/handlers/analyze-feed-log-handler.ts',
        ),
        handler: 'handler',
        description: 'Analyze Feed Log Handler Lambda function',
        timeout: cdk.Duration.seconds(300),
      },
    )

    this.notifyUpdateHandler = new NodejsFunction(this, 'notifyUpdateHandler', {
      ...commonNodejsProps,
      functionName: `chase-light-${stage}-api-feedAnalyzer-notifyUpdateHandler`,
      entry: path.join(
        apiBasePath,
        'src/handlers/step-functions/feed-analyzer/handlers/notify-update-handler.ts',
      ),
      handler: 'handler',
      description: 'Notify Update Handler Lambda function',
    })

    // ASLファイルを読み込み、Lambda関数のARNを置換
    const aslFilePath = path.join(__dirname, '../feed-analyzer.asl.json')
    const aslTemplate = fs.readFileSync(aslFilePath, 'utf8')
    const aslDefinition = aslTemplate
      .replace('${listFeedHandlerArn}', this.listFeedHandler.functionArn)
      .replace(
        '${createFeedLogsHandlerArn}',
        this.createFeedLogsHandler.functionArn,
      )
      .replace(
        '${enqueuePendingFeedLogHandlerArn}',
        this.enqueuePendingFeedLogHandler.functionArn,
      )
      .replace(
        '${notifyUpdateHandlerArn}',
        this.notifyUpdateHandler.functionArn,
      )

    // Step Functions State Machine
    this.feedAnalyzerStateMachine = new sfn.StateMachine(this, 'FeedAnalyzer', {
      stateMachineName: `chase-light-${stage}-FeedAnalyzer`,
      definitionBody: sfn.DefinitionBody.fromString(aslDefinition),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'FeedAnalyzerLogGroup', {
          logGroupName: `/aws/states/chase-light-${stage}-FeedAnalyzer`,
          retention: logs.RetentionDays.TWO_WEEKS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
      },
    })

    // Lambda関数の実行権限を付与
    this.listFeedHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.createFeedLogsHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.enqueuePendingFeedLogHandler.grantInvoke(
      this.feedAnalyzerStateMachine.role,
    )
    this.analyzeFeedLogHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
    this.notifyUpdateHandler.grantInvoke(this.feedAnalyzerStateMachine.role)
  }
}
