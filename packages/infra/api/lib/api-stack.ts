import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

// 分割したコンポーネントのインポート
import { LambdaLayers } from './components/lambda-layers'
import { Queues } from './components/queues'
import { IamRoles } from './components/iam'
import { LambdaCommon } from './components/lambda-common'
import { ApiGatewayResources } from './components/api-gateway'
import { StepFunctionResources } from './components/step-functions'

interface ApiStackProps extends cdk.StackProps {
  stage: string
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const { stage } = props

    // Lambda Layers
    const lambdaLayers = new LambdaLayers(this, 'LambdaLayers')

    // SQS Queues
    const queues = new Queues(this, 'Queues')

    // IAM Roles and Policies
    const iamRoles = new IamRoles(this, 'IamRoles', {
      stage,
      feedAnalyzeQueue: queues.feedAnalyzeQueue,
    })

    // 共通のLambda設定
    const lambdaCommon = new LambdaCommon(this, 'LambdaCommon', {
      stage,
      lambdaRole: iamRoles.lambdaRole,
      commonLayer: lambdaLayers.commonLayer,
      otelLayer: lambdaLayers.otelLayer,
      feedAnalyzeQueue: queues.feedAnalyzeQueue,
    })

    // API Gateway と関連するLambda関数
    const apiGateway = new ApiGatewayResources(this, 'ApiGateway', {
      stage,
      commonLambdaProps: lambdaCommon.commonLambdaProps,
      openaiLayer: lambdaLayers.openaiLayer,
    })

    // Step Functions と関連するLambda関数
    const stepFunctions = new StepFunctionResources(this, 'StepFunctions', {
      stage,
      commonLambdaProps: lambdaCommon.commonLambdaProps,
    })

    // 出力
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.api.url,
      description: 'API Gateway endpoint URL',
    })

    new cdk.CfnOutput(this, 'FeedAnalyzeQueueUrl', {
      value: queues.feedAnalyzeQueue.queueUrl,
      description: 'Feed Analyze Queue URL',
    })

    new cdk.CfnOutput(this, 'FeedAnalyzerStateMachineArn', {
      value: stepFunctions.feedAnalyzerStateMachine.stateMachineArn,
      description: 'Feed Analyzer State Machine ARN',
    })
  }
}
