# 概要

現在このシステムはServerless Frameworkで構築されていますが、
CDKによりデプロイ、AWS SAMによりローカル開発するように変更したいと考えています。

まずは packages/api配下がターゲットです。

以下のようなイメージの構成に変更したいです。

- packages/infra/api配下にCDKのプロジェクトを初期化(pnpmのworkspaceを利用)
- 現行のpackages/api/serverless.tsの記述を元に、CDKのコードに変換
- packages/api/packages.json, またはpackages/infra/api/packages.jsonにSAMの sam local invoke, sam local start-apiを実行するためのスクリプトを追加

# タスクリスト

それぞれのステップが終わったタイミングでユーザーに確認を求めてください。
(確認して問題なければその時点でユーザーがGitにコミットしながら進めていこうと考えています)

- [x] 1-1. packages/infra/apiをpnpm workspaceで初期化し、CDKをインストールする
- [x] 1-2. packages/api/serverless.ts の内容をCDKに変換する
- [x] 1-3. packages/api/packages.json, またはpackages/infra/api/packages.jsonにSAMの sam local invoke, sam local start-apiを実行するためのスクリプトを追加
- [x] 1-4. packages/infra/api/lib/api-stack.ts では、StepFunctionsに関するCDKコードの定義が完了していません。
      最初に以下を参考に、移行が必要な関数の一覧を確認してください。

  - /packages/api/src/handlers/step-functions/feed-analyzer/index.ts#L82-L86

- [x] 1-5. 各種リソースのstage名は末尾に付けるのではなく、 `chase-light-${stage}` のようにプロジェクト名の後ろに付けるようにしてください
  - 例
    - 改修前： `chase-light-api-feedAnalyzer-enqueuePendingFeedLogHandler-${stage}`
    - 改修後： `chase-light-${stage}-api-feedAnalyzer-enqueuePendingFeedLogHandler`
- [x] 1-6. 現在 packages/infra/api/lib/api-stack.ts は1ファイルで長くなってきているので、api-stack.ts をメインとして分割してください。
- [x] 1-7. packages/infra/api/lib/components/step-functions.ts では現在、ステートマシンの記述がJSON文字列になっています。TypeScriptの型で保護したいので、CDKの `aws-cdk-lib.aws_stepfunctions.StateGraph` などを利用して記述してください。
