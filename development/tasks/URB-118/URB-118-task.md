# タスクの全体像

このプロジェクトの packages/api ディレクトリにあるコードは現在
Serverless Framework v4でAWSにデプロイしていますが、これを SAMを利用してデプロイするように移行したいです。

一度に全体を移行することは難しいため、段階的に移行を進めていきます。
(AWSにデプロイする際、ステージ名を分けることで新旧両方が存在できるようにする予定です)

また、今回のタスク内でAWSリソースの命名規則の見直しも行う予定です。

# 今回のタスクの概要

課題番号: URB-118

まずは、API Gatewayと一部のLambda関数の移行を試します。
これのデプロイ、動作確認を確認出来たら別タスクで他の関数も移行を行う予定です。

- ServerlessFramework関連ファイル:

  - packages/api/serverless.ts
  - packages/api/src/handlers/api-gateway/user/index.ts:15-33

- SAM
  - packages/infra/apiフォルダを作成し、その中に初期化

デプロイはユーザーが行うので、あなたはServerlessFramework -> SAMへの移行に集中してください。

# リソースの命名規則

規則： `chase-light-[ステージ名]-api-[リソース名]`
