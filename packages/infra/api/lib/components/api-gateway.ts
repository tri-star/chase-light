import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import * as path from 'path'

export interface ApiGatewayProps {
  stage: string
  commonLambdaProps: Omit<cdk.aws_lambda.FunctionProps, 'code' | 'handler'>
  commonNodejsProps: Omit<NodejsFunctionProps, 'entry' | 'handler'>
  openaiLayer: lambda.LayerVersion
  apiBasePath: string
}

export class ApiGatewayResources extends Construct {
  public readonly api: apigateway.RestApi
  public readonly userApiLambda: lambda.Function
  public readonly feedApiLambda: lambda.Function
  public readonly notificationApiLambda: lambda.Function
  public readonly openApiLambda: lambda.Function

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id)

    const { stage, commonLambdaProps, commonNodejsProps, openaiLayer, apiBasePath } = props

    // API Gatewayの作成
    this.api = new apigateway.RestApi(this, 'ChaseLight-api', {
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
    this.userApiLambda = new NodejsFunction(this, 'UserApiFunction', {
      ...commonNodejsProps,
      functionName: `chase-light-${stage}-api-user`,
      entry: path.join(apiBasePath, 'src/handlers/api-gateway/user/index.ts'),
      handler: 'handler',
      description: 'User API Lambda function',
    })

    const userApiResource = this.api.root.addResource('user')
    userApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.userApiLambda),
    })

    // フィードAPI
    this.feedApiLambda = new NodejsFunction(this, 'FeedApiFunction', {
      ...commonNodejsProps,
      functionName: `chase-light-${stage}-api-feed`,
      entry: path.join(apiBasePath, 'src/handlers/api-gateway/feed/index.ts'),
      handler: 'handler',
      description: 'Feed API Lambda function',
      layers: [...commonNodejsProps.layers!, openaiLayer],
    })

    const feedApiResource = this.api.root.addResource('feed')
    feedApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.feedApiLambda),
    })

    // 通知API
    this.notificationApiLambda = new NodejsFunction(
      this,
      'NotificationApiFunction',
      {
        ...commonNodejsProps,
        functionName: `chase-light-${stage}-api-notification`,
        entry: path.join(apiBasePath, 'src/handlers/api-gateway/notification/index.ts'),
        handler: 'handler',
        description: 'Notification API Lambda function',
      },
    )

    const notificationApiResource = this.api.root.addResource('notification')
    notificationApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(
        this.notificationApiLambda,
      ),
    })

    // OpenAPI UI
    this.openApiLambda = new NodejsFunction(this, 'OpenApiFunction', {
      ...commonNodejsProps,
      functionName: `chase-light-${stage}-api-openapi`,
      entry: path.join(apiBasePath, 'src/handlers/api-gateway/open-api/index.ts'),
      handler: 'handler',
      description: 'OpenAPI UI Lambda function',
    })

    const openApiResource = this.api.root.addResource('api')
    openApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.openApiLambda),
    })
  }
}