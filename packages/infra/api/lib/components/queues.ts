import * as cdk from 'aws-cdk-lib'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

export interface IamProps {
  stage: string
}

export class Queues extends Construct {
  public readonly feedAnalyzeDlq: sqs.Queue
  public readonly feedAnalyzeQueue: sqs.Queue

  constructor(scope: Construct, id: string, props?: IamProps) {
    super(scope, id)

    const { stage } = props || {}

    // Dead Letter Queue
    this.feedAnalyzeDlq = new sqs.Queue(this, `${stage}FeedAnalyzeDlq`, {
      queueName: `${stage}FeedAnalyzeDlq`,
      retentionPeriod: cdk.Duration.days(14), // 1209600 seconds
    })

    // Main Queue
    this.feedAnalyzeQueue = new sqs.Queue(this, `${stage}FeedAnalyzeQueue`, {
      queueName: `${stage}FeedAnalyzeQueue`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: this.feedAnalyzeDlq,
        maxReceiveCount: 5,
      },
    })
  }
}
