#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api-stack'

const app = new cdk.App()
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT,
  region:
    process.env.CDK_DEFAULT_REGION ||
    process.env.AWS_REGION ||
    'ap-northeast-1',
}

const stage = app.node.tryGetContext('stage') || process.env.STAGE || 'dev'

new ApiStack(app, `ChaseLight-Api-${stage}`, {
  stackName: `chase-light-api-${stage}`,
  stage,
  env,
  description: `Chase Light API Stack (${stage})`,
})

app.synth()
