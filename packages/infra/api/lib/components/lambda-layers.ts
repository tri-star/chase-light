import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'

export class LambdaLayers extends Construct {
  public readonly commonLayer: lambda.LayerVersion
  public readonly openaiLayer: lambda.LayerVersion
  public readonly otelLayer: lambda.ILayerVersion

  constructor(scope: Construct, id: string) {
    super(scope, id)

    // Common Layer
    this.commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../../../../lambda-layers/common'),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies layer',
    })

    // OpenAI Layer
    this.openaiLayer = new lambda.LayerVersion(this, 'OpenaiLayer', {
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../../../../lambda-layers/openai'),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'OpenAI SDK layer',
    })

    // OpenTelemetry Layer (参照のみ)
    this.otelLayer = lambda.LayerVersion.fromLayerVersionAttributes(
      this,
      'OtelLayer',
      {
        layerVersionArn: `arn:aws:lambda:${cdk.Stack.of(this).region}:${
          cdk.Stack.of(this).account
        }:layer:otel-collector:7`,
      },
    )
  }
}
