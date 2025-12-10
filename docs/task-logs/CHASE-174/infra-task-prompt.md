このブランチでは以下のSOW、作業メモを使い作業してきました。

- @docs/sow/20251208-CHASE-174.md
- @docs/task-logs/CHASE-174/20251208-01-log.md

今回Lambda関数, SQSキューが増えたことで、　packages/backend/infrastructure フォルダ配下のSAM templateの更新が必要になると思うため、確認をお願いします。
SQSはローカル環境ではElasticMQを使う必要があります。

また、Lambdaはビルドのために専用のスクリプトでビルドしているので、そちらの改修も必要です。
この点は以下を確認してください。

- packages/backend/scripts/build-lambda.mjs
- packages/backend/scripts/lambda-config.mjs

まずは、改修のプランを作成してください。
