# タスク概要

アプリケーションに「フィード削除機能」を追加します。

# 作業手順

- packages/app/src/pages/feeds/[id].vueの画面内に削除ボタンがあるため、このボタンを押下すると確認アラートを表示します。
- ユーザーがOKした場合、フィード削除APIを呼び出し、一覧画面に戻ります。
  - APIはpackages/app/src/server/api配下に仮で実装してください。
- 削除に成功した場合は削除した旨のトーストを表示します。
  - packages/app/src/composables/use-toast.ts を参照
- その後、packages/api/src/handlers/api-gateway/feed/actions 配下にフィード削除用URLを追加します。
  この場所にAPIを追加する時はプロジェクト固有の書き方があるため、以下のファイルを参考に実装してください。
  - packages/api/src/handlers/api-gateway/feed/actions/create-feed-action.ts
  - packages/api/src/handlers/api-gateway/feed/index.ts
- APIを実装したらAPIのテストについても実装をお願いします。
- ここまで来たら以下の手順でpackages/app/src/server/api配下に仮で実装したAPI呼び出しを実実装に置き換えてください
  - appパッケージ内でAPIクライアントを更新する(コードの再生成)
  - APIクライアントにメソッドが追加されるので、それを使って仮実装部分を置き換える
- ここまで実装したら、ユーザーに報告してください
