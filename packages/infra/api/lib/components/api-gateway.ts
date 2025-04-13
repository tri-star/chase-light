import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import * as path from 'path'

export interface ApiGatewayProps {
  stage: string
  commonLambdaProps: cdk.aws_lambda.FunctionProps
  openaiLayer: lambda.LayerVersion
}

export class ApiGatewayResources extends Construct {
  public readonly api: apigateway.RestApi
  public readonly userApiLambda: lambda.Function
  public readonly feedApiLambda: lambda.Function
  public readonly notificationApiLambda: lambda.Function
  public readonly openApiLambda: lambda.Function

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id)

    const { stage, commonLambdaProps, openaiLayer } = props

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
    this.userApiLambda = new lambda.Function(this, 'UserApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-${stage}-api-user`,
      handler: 'src/handlers/api-gateway/user/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
      description: 'User API Lambda function',
    })

    const userApiResource = this.api.root.addResource('user')
    userApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.userApiLambda),
    })

    // フィードAPI
    this.feedApiLambda = new lambda.Function(this, 'FeedApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-${stage}-api-feed`,
      handler: 'src/handlers/api-gateway/feed/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
      description: 'Feed API Lambda function',
      layers: [...commonLambdaProps.layers!, openaiLayer],
    })

    const feedApiResource = this.api.root.addResource('feed')
    feedApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.feedApiLambda),
    })

    // 通知API
    this.notificationApiLambda = new lambda.Function(
      this,
      'NotificationApiFunction',
      {
        ...commonLambdaProps,
        functionName: `chase-light-${stage}-api-notification`,
        handler: 'src/handlers/api-gateway/notification/index.handler',
        code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
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
    this.openApiLambda = new lambda.Function(this, 'OpenApiFunction', {
      ...commonLambdaProps,
      functionName: `chase-light-${stage}-api-openapi`,
      handler: 'src/handlers/api-gateway/open-api/index.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../../../api')),
      description: 'OpenAPI UI Lambda function',
    })

    const openApiResource = this.api.root.addResource('api')
    openApiResource.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(this.openApiLambda),
    })
  }
}