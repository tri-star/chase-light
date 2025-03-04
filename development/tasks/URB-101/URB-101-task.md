# タスク概要

アプリケーションに「フィード詳細画面」を追加します。

- /pages/feeds/index.vueの画面で表示する各フィードの名前をリンクに変更し、詳細画面へのリンクとします。
- 詳細画面では次の情報を表示します。
  - フィード名
  - フィードのURL
  - フィードの種類(今は"GitHubリリース"固定)
  - フィードの最終更新日時
    - feed_github_metas.lastReleaseDateの最新日付
  - フィードの登録日時
  - フィードの更新日時
  - 画面下部に以下を表示
    - 編集ボタン (ボタンのみ。処理はまだ実装しません)
    - 戻るボタン
    - 削除ボタン (ボタンのみ。処理はまだ実装しません)

# 改修内容

基本的には /CLAUDE.md, /packages/app/CLAUDE.md に記述した規則に従ってください。

## (1). 詳細画面の追加

- packages/app配下のNuxt.jsアプリのpages上に詳細画面を追加。
- ここに追加するのはエントリーポイント的なファイルで、実体はcomponents/pages配下に作成してください。
- フィードの詳細情報を取得するAPIは /api/feed/[id] となる予定ですが、今はこのAPIは /packages/app/src/server/api配下に存在しません。
  - 必要に応じ作成してください。
  - この時点では作成せず、固定値で実装しても構いません。
- フロントエンド側はテストが十分整備出来ていないため、テストは不要です。
  動作確認はユーザーに求めてください。

## (2). フィード詳細情報取得API の実装

/packages/app/src/server/api/feeds/[id].get.ts は今仮の実装ですが、これを実際の実装に置き換えます。
このために以下の作業を行います。

- packages/api/src/handlers/api-gateway/feed/actions配下に fetch-feed-action.tsを作成します。
  内容は packages/api/src/handlers/api-gateway/feed/actions/list-feed-action.ts などを参考にしてください。
- このプロジェクト固有のルールで、actions配下にAPIを追加したら、一つ上の階層にあるindex.tsもメンテナンスする必要があります。
- このAPIに対するテストを作成、テストが通ることを確認してください。
