# タスク概要

アプリケーションに「お知らせの既読表現」を追加します。

今、このアプリケーションには画面右上のお知らせアイコンを押下すると画面右端にお知らせ一覧をポップアップ表示する機能があります。
ただ、「このお知らせを読んだのかどうか」がユーザーには分かりません。

そこで、今回は以下のように改修を行おうと考えています。

- ユーザーがお知らせをポップアップで表示した際に、画面上に表示されている全てのお知らせを既読状態にする
- 既読状態のお知らせは表示時にopacityを若干下げるなど、区別して表示する

# 関連ファイル

- packages/api/prisma/schema.prisma: Prismaのスキーマ定義ファイル。既読状態を管理するフラグはNotification.readとして既に存在します。
- packages/api/src/features/notification/domain/notification.ts: お知らせの型定義を含むファイル
- packages/api/src/handlers/api-gateway/notification/actions: お知らせの既読状態更新APIを定義するフォルダ
- packages/app/src/components/common/notification/NotificationCard.vue: お知らせのカードコンポーネント
- packages/app/src/components/common/notification/NotificationListBox.vue: お知らせ一覧のロードと表示を行うコンポーネント

# 作業の進め方

- サーバーサイド、フロントのどちらから作業を始めるかは自由です。
- フロントエンドの作業時は、開発サーバー(phpm dev)は私の方で起動するので、あなたは起動しないでください

# テスト・動作確認について

## サーバーサイド

packages/api/src/handlers/api-gateway/notification/actions配下に追加するAPIについては、テストの実装をお願いします。
テストの書き方は周辺のコードを参考にしてください。

## フロントエンド

フロントエンドはテストの整備が十分に出来ておらず、nuxt-auth-utilsのテスト自体難しいことから、
今回はユニットテストは不要です。

動作確認はユーザーが行うため、確認時はユーザーに問い合わせてください。
