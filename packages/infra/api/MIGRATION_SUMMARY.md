# Migration Summary: Serverless Framework v4 to SAM

## Overview
Task: URB-118 - Migrate API Gateway and User Lambda function from Serverless Framework to SAM

## What Was Migrated

###  Completed
1. **API Gateway Configuration**
   - Migrated from `serverless.ts` provider.apiGateway settings
   - Applied new naming convention: `chase-light-${Stage}-api-gateway`
   - Maintained compression settings and tracing

2. **User Lambda Function**
   - Source: `packages/api/src/handlers/api-gateway/user/index.ts`
   - Function Name: `chase-light-${Stage}-api-user-handler`
   - Events: Both `/users` and `/users/{proxy+}` paths
   - Runtime: nodejs20.x with 1024MB memory, 15s timeout

3. **SQS Resources**
   - `FeedAnalyzeQueue`: `chase-light-${Stage}-api-feed-analyze-queue`
   - `FeedAnalyzeDlq`: `chase-light-${Stage}-api-feed-analyze-dlq`
   - Maintained compatibility with existing Step Functions

4. **IAM Permissions**
   - Secrets Manager access for database connection
   - X-Ray tracing permissions
   - SQS send message permissions

5. **Environment Variables**
   - All required environment variables from original configuration
   - Parameter-based configuration for stage-specific values

### ó Pending (Future Tasks)
- Feed Lambda handlers (`feedApp.getLambdaDefinition()`)
- Notification Lambda handlers (`notificationApp.getLambdaDefinition()`)
- Scaler UI Lambda handlers (`scalerUiApp.getLambdaDefinition()`)
- Step Functions state machine (`feedAnalyzerStateMachine`)
- Lambda layers (currently using ARN references)

## Naming Convention Applied

**Pattern**: `chase-light-[stage]-api-[resource-name]`

**Examples**:
- API Gateway: `chase-light-dev-api-gateway`
- Lambda Function: `chase-light-dev-api-user-handler`
- SQS Queue: `chase-light-dev-api-feed-analyze-queue`
- SQS DLQ: `chase-light-dev-api-feed-analyze-dlq`

## Key Technical Changes

1. **Configuration Format**
   - From: TypeScript configuration (`serverless.ts`)
   - To: YAML CloudFormation template (`template.yaml`)

2. **Lambda Layer References**
   - From: Local layer definitions in `serverless.ts`
   - To: ARN references (keeping existing layers for compatibility)

3. **Environment Variables**
   - From: Custom variables and `${env:}` syntax
   - To: CloudFormation parameters and SSM references

4. **Resource Management**
   - From: Serverless Framework abstractions
   - To: Direct CloudFormation resource definitions

## Validation Points

- Lambda function handler path matches original: `index.handler`
- API Gateway events preserved: `ANY /users` and `ANY /users/{proxy+}`
- Environment variables maintained for application compatibility
- SQS queue names preserve integration with existing Step Functions
- IAM permissions replicated from original configuration

## Deployment Ready

The SAM template is ready for deployment with:
- `template.yaml`: Complete infrastructure definition
- `samconfig.toml`: Deployment configuration
- `package.json`: Build and deployment scripts
- Documentation: README and migration notes