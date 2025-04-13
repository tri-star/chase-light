import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

export interface IamProps {
  stage: string
  feedAnalyzeQueue: sqs.Queue
}

export class IamRoles extends Construct {
  public readonly lambdaRole: iam.Role

  constructor(scope: Construct, id: string, props: IamProps) {
    super(scope, id)

    const { stage, feedAnalyzeQueue } = props

    // Lambda実行用IAMロール
    this.lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })

    // 基本的な実行権限を追加
    this.lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    )

    // Secrets Managerの権限
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:secret:${stage}/supabase/db_url*`,
          `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:secret:openai*`,
        ],
      }),
    )

    // X-Rayの権限
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      }),
    )

    // SQSの権限
    this.lambdaRole.addToPolicy(
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
  }
}