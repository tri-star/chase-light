# タスク概要

アプリケーションにログアウト機能を追加します。

# 改修内容

## (1). ログアウトAPIの追加

packages/app配下のNuxt.jsアプリのAPIルート上にログアウト用APIを作成、
nuxt-auth-utils等を利用し、Auth0からログアウトするAPIを実装します。
(今回、packages/api側は改修しません)

エンドポイントの案: /api/auth/logout

ログアウト後は "/" にリダイレクトすると、結果的にログイン画面にリダイレクトする動作になる想定です。

## (2). 共通ヘッダ部分のユーザーアイコン右上にログアウトメニューを追加

- 対象ファイル
  - 共通ヘッダ：packages/app/src/components/common/header/AppHeader.vue
  - ポップアップメニュー: 以下が使えれば利用
    - packages/app/src/components/common/A3PopupMenuList.vue

# テスト・動作確認について

フロントエンドはテストの整備が十分に出来ておらず、nuxt-auth-utilsのテスト自体難しいことから、
今回はユニットテストは不要です。

動作確認はユーザーが行うため、確認時はユーザーに問い合わせてください。
