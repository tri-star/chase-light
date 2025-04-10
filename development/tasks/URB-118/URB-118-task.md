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

- [ ] packages/infra/apiをpnpm workspaceで初期化し、CDKをインストールする
- [ ] packages/api/serverless.ts の内容をCDKに変換する
- [ ] packages/api/packages.json, またはpackages/infra/api/packages.jsonにSAMの sam local invoke, sam local start-apiを実行するためのスクリプトを追加
