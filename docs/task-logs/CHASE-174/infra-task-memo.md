# CHASE-174: 翻訳ワーカーのインフラ・ビルド設定更新計画

## 概要

CHASE-174タスクで実装された翻訳ワーカー（translate-activity-body）を動作させるために必要なインフラ・ビルド設定の更新を行う。

## 対象ファイル

### 更新対象

| ファイル                                               | 更新内容                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `packages/backend/infrastructure/sam-template.yaml`    | TranslationJobsQueue + DLQ、TranslateActivityBodyFunction、CloudWatch Alarm、Outputs追加                    |
| `packages/backend/scripts/lambda-config.mjs`           | translate-activity-body ワーカー設定追加                                                                    |
| `packages/backend/infrastructure/local-variables.json` | translation-jobs-queue 設定追加                                                                             |
| `packages/backend/.env.example`                        | TRANSLATION_QUEUE_URL 環境変数追加                                                                          |
| `packages/backend/.env.testing`                        | TRANSLATION_QUEUE_URL 環境変数追加。PORT, DB_PORTの行は今回カスタマイズしているのでコミットしないように注意 |

### 修正が必要なファイル（SQSEvent対応）

| ファイル                                                                                             | 修正内容                               |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `packages/backend/src/features/activities/workers/translate-activity-body/handler.ts`                | SQSEvent形式に対応するよう修正         |
| `packages/backend/src/features/activities/workers/translate-activity-body/__tests__/handler.test.ts` | テストをSQSEvent形式に対応             |
| `packages/backend/src/features/detection/workers/process-updates/handler.ts`                         | SQSEvent形式に対応するよう修正         |
| `packages/backend/src/features/detection/workers/process-updates/__tests__/handler.test.ts`          | テストをSQSEvent形式に対応             |
| `packages/backend/scripts/lib/elasticmq-poller/message-processor.ts`                                 | SQSEvent形式でLambdaを呼び出すよう修正 |

---

## 実装計画

### Phase 1: SAMテンプレート更新

**ファイル**: `packages/backend/infrastructure/sam-template.yaml`

#### 1.1 SQSキュー追加（ProcessUpdatesQueueパターンに倣う）

```yaml
# Translation Jobs Queue
TranslationJobsQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: !Sub "${AWS::StackName}-translation-jobs-queue"
    VisibilityTimeout: 360
    MessageRetentionPeriod: 1209600 # 14 days
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt TranslationJobsDeadLetterQueue.Arn
      maxReceiveCount: 3

TranslationJobsDeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: !Sub "${AWS::StackName}-translation-jobs-dlq"
    MessageRetentionPeriod: 1209600 # 14 days
```

#### 1.2 Lambda関数追加

```yaml
TranslateActivityBodyFunction:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: !Sub "${AWS::StackName}-translate-activity-body"
    CodeUri: ../dist/lambda/translate-activity-body/
    Handler: index.handler
    Runtime: nodejs22.x
    Timeout: 300
    MemorySize: 512
    ReservedConcurrentExecutions: 5
    Events:
      SQSEvent:
        Type: SQS
        Properties:
          Queue: !GetAtt TranslationJobsQueue.Arn
          BatchSize: 1
          MaximumBatchingWindowInSeconds: 0
    Policies:
      - Statement:
          - Effect: Allow
            Action:
              - ssm:GetParameter
            Resource:
              - !Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Stage}/supabase/db_url"
              - !Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Stage}/openai/api_key"
      - Statement:
          - Effect: Allow
            Action:
              - sqs:ReceiveMessage
              - sqs:DeleteMessage
              - sqs:GetQueueAttributes
            Resource: !GetAtt TranslationJobsQueue.Arn
```

#### 1.3 CloudWatch Alarm追加

```yaml
TranslationJobsDeadLetterQueueAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${AWS::StackName}-translation-dlq-messages"
    AlarmDescription: "Alert when messages appear in Translation Jobs DLQ"
    MetricName: ApproximateNumberOfVisibleMessages
    Namespace: AWS/SQS
    Statistic: Maximum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 1
    ComparisonOperator: GreaterThanOrEqualToThreshold
    Dimensions:
      - Name: QueueName
        Value: !GetAtt TranslationJobsDeadLetterQueue.QueueName
    AlarmActions:
      - !Ref AlertsTopic
    TreatMissingData: notBreaching
```

#### 1.4 Outputs追加

```yaml
TranslateActivityBodyFunctionArn:
  Description: "ARN of the translate activity body function"
  Value: !GetAtt TranslateActivityBodyFunction.Arn
  Export:
    Name: !Sub "${AWS::StackName}-TranslateActivityBodyFunctionArn"

TranslationJobsQueueUrl:
  Description: "URL of the translation jobs SQS queue"
  Value: !Ref TranslationJobsQueue
  Export:
    Name: !Sub "${AWS::StackName}-TranslationJobsQueueUrl"

TranslationJobsQueueArn:
  Description: "ARN of the translation jobs SQS queue"
  Value: !GetAtt TranslationJobsQueue.Arn
  Export:
    Name: !Sub "${AWS::StackName}-TranslationJobsQueueArn"
```

---

### Phase 2: Lambda設定ファイル更新

**ファイル**: `packages/backend/scripts/lambda-config.mjs`

```javascript
"translate-activity-body": {
  name: "translate-activity-body-lambda",
  description: "Translate activity body content via SQS trigger",
  entryPoint: "./src/features/activities/workers/translate-activity-body/index.ts",
  externalPackages: [
    "@aws-sdk/*",
    "aws-sdk",
    "pg",
    "drizzle-orm",
    "dotenv",
    "openai",
  ],
  dependencies: {
    "@aws-sdk/client-ssm": "^3.848.0",
    openai: "^6.3.0",
    pg: "^8.16.0",
    "drizzle-orm": "^0.44.2",
    dotenv: "^16.5.0",
  },
},
```

---

### Phase 3: ローカル開発環境設定

#### 3.1 local-variables.json更新

**ファイル**: `packages/backend/infrastructure/local-variables.json`

```json
{
  "Variables": {
    "TranslationJobsQueueUrl": "http://elasticmq:9324/000000000000/translation-jobs-queue",
    "TranslateActivityBodyFunctionArn": "TranslateActivityBodyFunction"
  },
  "QueueConfig": {
    "translation-jobs-queue": {
      "lambdaFunctionName": "TranslateActivityBodyFunction",
      "pollInterval": 5000,
      "enabled": true
    }
  }
}
```

#### 3.2 .env.example更新

**ファイル**: `packages/backend/.env.example`

```bash
# ==============================================
# SQS キュー設定
# ==============================================

# 翻訳ジョブキューURL（ローカル開発時はElasticMQ、AWS時は実際のSQS URL）
TRANSLATION_QUEUE_URL=http://localhost:9324/000000000000/translation-jobs-queue
```

#### 3.3 .env.testing更新

**ファイル**: `packages/backend/.env.testing`

```bash
# SQS キュー設定 (テスト用 - スタブを使用するため空)
TRANSLATION_QUEUE_URL=
```

---

### Phase 4: SQSEvent形式への対応（handler修正）

#### 4.1 translate-activity-body handler修正

**ファイル**: `packages/backend/src/features/activities/workers/translate-activity-body/handler.ts`

現在の直接呼び出し形式からSQSEvent形式に対応するよう修正：

```typescript
import type { SQSEvent, SQSBatchResponse, Context } from "aws-lambda";
import { connectDb } from "../../../../db/connection";
import { TransactionManager } from "../../../../core/db";
import { DrizzleActivityTranslationStateRepository } from "../../infra";
import {
  BodyTranslationAdapter,
  BodyTranslationStubAdapter,
} from "../../infra";
import { ProcessActivityTranslationJobUseCase } from "../../application/use-cases";

type TranslateActivityBodyInput = {
  activityId: string;
  targetLanguage?: string;
};

const createBodyTranslationPort = () => {
  if (
    process.env.OPENAI_API_KEY &&
    process.env.USE_TRANSLATION_STUB !== "true"
  ) {
    return new BodyTranslationAdapter(process.env.OPENAI_API_KEY);
  }
  return new BodyTranslationStubAdapter();
};

export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<SQSBatchResponse> => {
  console.info("translate-activity-body SQS event:", JSON.stringify(event));
  console.info("context awsRequestId:", context.awsRequestId);

  await connectDb();

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as TranslateActivityBodyInput;

      if (!payload.activityId) {
        console.error(
          "activityId is required, skipping record:",
          record.messageId,
        );
        continue;
      }

      await TransactionManager.transaction(async () => {
        const translationStateRepository =
          new DrizzleActivityTranslationStateRepository();
        const bodyTranslationPort = createBodyTranslationPort();
        const useCase = new ProcessActivityTranslationJobUseCase(
          translationStateRepository,
          bodyTranslationPort,
        );

        await useCase.execute({
          activityId: payload.activityId,
          targetLanguage: payload.targetLanguage,
        });
      });

      console.info(`Successfully processed activity: ${payload.activityId}`);
    } catch (error) {
      console.error(`Failed to process record ${record.messageId}:`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
```

**テストファイル修正**: `__tests__/handler.test.ts`

SQSEvent形式のモックデータを使用するようテストを修正する。

#### 4.2 process-updates handler修正

**ファイル**: `packages/backend/src/features/detection/workers/process-updates/handler.ts`

translate-activity-bodyと同様にSQSEvent形式に対応：

```typescript
import type { SQSEvent, SQSBatchResponse, Context } from "aws-lambda";

interface ProcessUpdatesInput {
  activityId: string;
}

export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<SQSBatchResponse> => {
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", context.awsRequestId);

  await connectDb();

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as ProcessUpdatesInput;

      if (!payload.activityId) {
        console.error("Missing activityId, skipping record:", record.messageId);
        continue;
      }

      await TransactionManager.transaction(async () => {
        // 既存のユースケース処理
        const activityRepository = new DrizzleActivityRepository();
        const translationAdapter = await createTranslationPort();
        const processUpdatesService = new ProcessUpdatesUseCase(
          activityRepository,
          translationAdapter,
        );

        await processUpdatesService.execute({
          activityIds: [payload.activityId],
        });
      });

      console.log(`Successfully processed activity: ${payload.activityId}`);
    } catch (error) {
      console.error(`Failed to process record ${record.messageId}:`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
```

#### 4.3 ポーラー修正（SQSEvent形式でLambda呼び出し）

**ファイル**: `packages/backend/scripts/lib/elasticmq-poller/message-processor.ts`

ポーラーがLambdaを呼び出す際、SQSEvent形式にラップするよう修正：

```typescript
/**
 * SQSメッセージからLambda実行用のペイロードを抽出
 * AWS本番環境と同じSQSEvent形式にラップする
 */
private extractPayload(message: Message): SQSEvent {
  if (!message.Body) {
    throw new Error("メッセージにBodyが含まれていません")
  }

  // SQSEvent形式にラップ
  const sqsEvent: SQSEvent = {
    Records: [
      {
        messageId: message.MessageId || crypto.randomUUID(),
        receiptHandle: message.ReceiptHandle || "",
        body: message.Body,  // 元のメッセージBody（JSONパースせずそのまま）
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: Date.now().toString(),
          SenderId: "local",
          ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:local:000000000000:local-queue",
        awsRegion: "us-east-1",
      },
    ],
  }

  return sqsEvent
}
```

---

## 実装手順まとめ

### Step 1: SAMテンプレート更新

1. TranslationJobsQueue + DLQ追加
2. TranslateActivityBodyFunction追加
3. CloudWatch Alarm追加
4. Outputs追加

### Step 2: Lambda設定ファイル更新

1. lambda-config.mjsにtranslate-activity-body設定追加

### Step 3: ローカル開発環境設定

1. local-variables.jsonに translation-jobs-queue設定追加
2. .env.example, .env.testingに TRANSLATION_QUEUE_URL追加

### Step 4: SQSEvent対応（handler修正）

1. translate-activity-body/handler.ts をSQSEvent形式に修正
2. process-updates/handler.ts をSQSEvent形式に修正
3. 各テストファイルをSQSEvent形式に対応
4. elasticmq-poller/message-processor.ts をSQSEvent形式でLambdaを呼び出すよう修正

### Step 5: ビルド・テスト

1. `pnpm --filter backend build:lambda` でビルド
2. `pnpm --filter backend test` でテスト実行
3. `pnpm lint` でリントチェック

---

## 動作確認手順

### ビルド

```bash
# 全Lambda関数をビルド
pnpm --filter backend build:lambda

# または単体ビルド
cd packages/backend
node scripts/build-lambda.mjs translate-activity-body
```

### ローカルテスト

```bash
# Dockerコンテナ起動
cd packages/backend
docker compose up -d

# SAM Local起動
sam local start-lambda -t infrastructure/sam-template.yaml --port 3002

# 別ターミナルでポーラー起動
pnpm poller --queue translation-jobs-queue
```

---

## 注意事項

1. **部分的なバッチ失敗**: `SQSBatchResponse`の`batchItemFailures`を返すことで、失敗したメッセージのみがリトライされる。

2. **既存テストへの影響**: handler.tsとポーラーの修正に伴い、既存のテストも更新が必要。

3. **ポーラーの型定義**: `@aws-sdk/client-sqs` の `Message` 型と `aws-lambda` の `SQSEvent` 型を適切にマッピングする必要がある。

4. **packages/backend/.env.testingのコミット時**: PORT, DB_PORTの行は今回カスタマイズしているのでコミットしないように注意。
