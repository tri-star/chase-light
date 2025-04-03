# タスク概要

お知らせを生成するバッチ処理を以下のように改修します。

- 現在：24時間以内に作成されたFeedLogを元にお知らせを作成
- 改修後：前回のバッチ処理起動時以降に生成されたFeedLogを元にお知らせを作成

# 作業内容

- システムレベルの設定情報を保持するテーブルを作成。テーブル名やカラム名は検討し、作業に入る前にユーザーに相談してください。
- バッチ処理の起動時、FeedLogを集める開始期間をこのテーブルに記録した日付から開始するようにしてください。
- バッチ処理の完了時、テーブルに現在時刻を記録するようにしてください。

# 関連情報

- packages/api/prisma/schema.prisma: Prismaのスキーマ定義
- packages/api/src/handlers/step-functions/feed-analyzer/handlers/notify-update-handler.ts: バッチ処理本体
- packages/api/prisma/seeds: PrismaFabbricaによるFactory置き場。ユニットテスト時、システム設定のダミーデータの作成が必要なためここでFactoryを定義してください。
