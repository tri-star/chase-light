# Chase Light API - SAM Migration

This directory contains the AWS SAM (Serverless Application Model) infrastructure configuration for migrating from Serverless Framework v4 to SAM.

## Migration Progress

This is a partial migration focusing on:
-  API Gateway configuration 
-  User Lambda handler function
-  SQS queues (Feed Analyze Queue and DLQ)
- ó Other Lambda functions (to be migrated in future tasks)
- ó Step Functions (to be migrated in future tasks)

## Naming Convention

All AWS resources follow the naming pattern:
```
chase-light-[stage]-api-[resource-name]
```

Examples:
- API Gateway: `chase-light-dev-api-gateway`
- Lambda Function: `chase-light-dev-api-user-handler`
- SQS Queue: `chase-light-dev-api-feed-analyze-queue`

## Prerequisites

1. AWS CLI configured
2. AWS SAM CLI installed
3. Node.js 20.x runtime

## Deployment Commands

```bash
# Build the SAM application
npm run build

# Deploy with guided setup (first time)
npm run deploy:guided

# Deploy subsequent changes
npm run deploy

# Local development
npm run local:start-api

# Validate template
npm run validate

# Sync changes during development
npm run sync
```

## Environment Variables

Configure the following parameters during deployment:

- `Stage`: Deployment stage (dev, staging, prod)
- `ApiUrl`: API base URL
- `Auth0Domain`: Auth0 domain for authentication
- `DatabaseUrl`: Database connection string (from SSM)
- `OpenAiApiKey`: OpenAI API key (from SSM)

## Key Differences from Serverless Framework

1. **Configuration Format**: YAML CloudFormation template instead of TypeScript configuration
2. **Layer References**: Direct ARN references instead of local layer definitions
3. **Environment Variables**: Template parameters instead of custom variables
4. **Resource Naming**: Explicit naming with stage prefix
5. **IAM Policies**: CloudFormation policy statements instead of Serverless Framework shortcuts

## Migration Notes

- The original Lambda code in `packages/api/src/handlers/api-gateway/user/` remains unchanged
- Only infrastructure configuration has been migrated
- SQS queues maintain compatibility with existing Step Functions
- API Gateway paths and methods match the original Serverless Framework configuration